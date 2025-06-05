// regulation-scraper.ts
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';
import puppeteer from 'puppeteer';

interface Regulation {
  id: number;
  content: string;
}

interface ScrapedRegulations {
  regulations: Regulation[];
  lastUpdated: string;
  source: string;
}

interface QuestionOption {
  question: string;
  options: string[];
}

interface Questions {
  intakeQuestions: Record<string, QuestionOption>;
}

class RegulationScraper {
  private htmlUrl: string;
  private outputPath: string;
  private questionsPath: string;

  constructor(
    htmlUrl: string, 
    outputPath: string = './components/logic/logic.tsx',
    questionsPath: string = './public/locales/en/questions.json'
  ) {
    this.htmlUrl = htmlUrl;
    this.outputPath = outputPath;
    this.questionsPath = questionsPath;
  }

  /**
   * Scrape regulations from the HTML website with async
   */
  async scrapeRegulations(): Promise<ScrapedRegulations> {
    try {
      console.log('🔍 Scraping regulations from:', this.htmlUrl);
      
      // Option 1: Use Puppeteer for full browser automation
      const browser = await puppeteer.launch();
      try {
        const page = await browser.newPage();
        
        // Set longer timeout for slow-loading content
        await page.setDefaultTimeout(30000);
        
        // Navigate to the page
        await page.goto(this.htmlUrl, { 
          waitUntil: 'networkidle2', // Wait until network is idle
          timeout: 30000 
        });
        
        // Wait for specific elements to load
        await page.waitForSelector('.regulation', { 
          timeout: 20000,
          visible: true 
        });
        
        // Extract regulations using page.evaluate to run code in browser context
        const regulations = await page.evaluate(() => {
          const regulationElements = document.querySelectorAll('.regulation');
          const results: { id: number; content: string }[] = [];
          
          regulationElements.forEach((element, index) => {
            const content = element.querySelector('p[data-field="content"]')?.textContent?.trim();
            if (content) {
              results.push({
                id: index + 1,
                content: content
              });
            }
          });
          
          return results;
        });
        
        console.log(`✅ Found ${regulations.length} regulations`);
        
        return {
          regulations,
          lastUpdated: new Date().toISOString(),
          source: this.htmlUrl
        };
        
      } finally {
        await browser.close();
      }
      
    } catch (error) {
      console.error('❌ Error scraping regulations:', error);
      throw error;
    }
  }

  /**
   * Generate questions using LLM based on regulations
   */
  async generateQuestionsWithLLM(regulations: ScrapedRegulations): Promise<Questions> {
    const prompt = this.buildQuestionsPrompt(regulations);
    
    try {
      console.log('🤖 Generating questions based on regulations...');
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 4000,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      });

      if (!response.ok) {
        console.error('❌ LLM API call failed:', response);
        throw new Error(`LLM API Error: ${response.status}`);
      }

      const data = await response.json() as { content: { text: string }[] };
      const questionsText = data.content[0].text;

      // Parse the JSON response
      let questions: Questions;
      try {
        // Clean up the response by removing markdown code blocks if present
        const cleanedResponse = questionsText.replace(/^```json\n?/, '').replace(/```$/, '').trim();
        questions = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('❌ Error parsing questions JSON:', parseError);
        console.log('Raw response:', questionsText);
        throw new Error('Failed to parse questions JSON from LLM response');
      }
      console.log(questions)
      console.log(questions.intakeQuestions)
      console.log(`✅ Generated ${Object.keys(questions.intakeQuestions).length} questions`);
      return questions;
    } catch (error) {
      console.error('❌ Error generating questions:', error);
      throw error;
    }
  }

  /**
   * Build the prompt for generating questions
   */
  private buildQuestionsPrompt(regulations: ScrapedRegulations): string {
    return `
You are an expert in Belgian administrative procedures for foreign workers.

CONTEXT:
Bridge is an app that helps foreign workers navigate Belgian bureaucracy by providing personalized task lists based on their situation.

UPDATED REGULATIONS:
${regulations.regulations.map(reg => `${reg.id}. ${reg.content}`).join('\n')}

BRIDGE APP CONTEXT:
- The app helps foreign workers understand what administrative tasks they need to complete
- Tasks include: municipality registration, employment contracts, health insurance, residence documents, emergency contacts, bank accounts, and practical information
- Different requirements apply based on EU vs non-EU citizenship, work duration, location, and other factors

TASK:
Based on the current Belgian regulations provided above, generate intake questions that will help determine what administrative tasks each foreign worker needs to complete.

REQUIREMENTS:
1. Generate questions that capture the key decision points in the regulations
2. Focus on factors that determine different administrative requirements:
   - EU vs non-EU citizenship status
   - Work duration and type
   - Location/province of work
   - Existing documentation status
   - Banking and financial setup
3. Each question should have 2-4 clear answer options
4. Questions should be in plain, accessible language
5. The number of questions can vary (typically 4-8 questions)

OUTPUT FORMAT:
Return ONLY a valid JSON object in this exact structure:

{
  "intakeQuestions": {
    "0": {
      "question": "Question text here?",
      "options": [
        "Option 1",
        "Option 2",
        "Option 3"
      ]
    },
    "1": {
      "question": "Second question text here?",
      "options": [
        "Option A",
        "Option B"
      ]
    }
  }
}

IMPORTANT:
- Return ONLY the JSON object, no additional text or explanation
- Use sequential numbers as keys starting from "0"
- Ensure the JSON is valid and properly formatted
- Base all questions on the actual regulations provided
- Make sure questions help determine administrative requirements for foreign workers in Belgium

Generate the questions now:
`;
  }

  /**
   * Call LLM to generate new logic based on regulations and questions
   */
  async generateLogicWithLLM(regulations: ScrapedRegulations, questions: Questions, currentLogic: string): Promise<string> {
    const prompt = this.buildLogicPrompt(regulations, questions, currentLogic);
    
    try {
      console.log('🤖 Calling LLM to generate new logic based on questions...');
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 4000,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      });

      if (!response.ok) {
        console.error('❌ LLM API call failed:', response);
        throw new Error(`LLM API Error: ${response.status}`);
      }

      const data = await response.json() as { content: { text: string }[] };
      const newLogic = data.content[0].text;

      console.log('✅ Generated new logic from LLM');
      return newLogic;
    } catch (error) {
      console.error('❌ Error calling LLM:', error);
      throw error;
    }
  }

  /**
   * Build the prompt for generating logic based on questions
   */
  private buildLogicPrompt(regulations: ScrapedRegulations, questions: Questions, currentLogic: string): string {
    // Build question mapping documentation
    const questionMapping = Object.entries(questions.intakeQuestions)
      .map(([index, q]) => {
        const optionsList = q.options.map((option, optIndex) => `  - ${optIndex}: "${option}"`).join('\n');
        return `- answers[${index}]: ${q.question}\n${optionsList}`;
      })
      .join('\n\n');

    return `
You are an expert TypeScript developer working on a Belgian administrative guidance app called "BRIDGE".

CONTEXT:
Bridge helps foreign workers navigate Belgian bureaucracy by providing personalized task lists based on their situation.

CURRENT LOGIC FILE:
\`\`\`typescript
${currentLogic}
\`\`\`

UPDATED REGULATIONS:
${regulations.regulations.map(reg => `${reg.id}. ${reg.content}`).join('\n')}

GENERATED QUESTIONS AND ANSWER MAPPING:
${questionMapping}

TASK DEFINITIONS FROM BRIDGE APP:
- municipality: Municipal registration at town hall
- contract: Employment contract & plukkaart (seasonal work permit)
- health: Health insurance arrangement
- bijlage3: Temporary residence document (Annex 3)
- emergency: Emergency contact setup
- bank: Belgian bank account opening
- practical: Practical information and worker rights

USER PROFILE STRUCTURE:
The user answers are stored in a UserProfile.answers array where each index corresponds to a question as mapped above.

INSTRUCTIONS:
1. Analyze the updated regulations for changes in Belgian work permit requirements
2. Update the generatePersonalizedTasks function logic based on new regulations and the generated questions
3. The function should access user responses via profile.answers[questionIndex] where questionIndex corresponds to the question mapping above
4. Pay special attention to:
   - EU vs non-EU worker requirements
   - Work duration thresholds - 90 days rule, single permit requirements
   - Regional differences - Flanders vs Wallonia vs Brussels
   - Seasonal work permit (plukkaart) requirements
   - Banking and residence requirements
   - Employment contract status

5. Maintain the existing TypeScript structure and imports
6. Only include tasks that are actually required based on the regulations
7. Add comments explaining the regulatory basis for each decision
8. Use the exact question indices from the mapping above

IMPORTANT: 
- Return ONLY the complete TypeScript file content
- Keep the existing import structure
- Ensure all logic is based on the current Belgian regulations provided
- Use profile.answers[index] to access user responses based on the question mapping provided
- You must ONLY choose tasks from the defined task list: municipality, contract, health, bijlage3, emergency, bank, practical

Based on the regulations and questions above, generate the updated logic.tsx file:

RETURN ONLY THE UPDATED LOGIC FILE CONTENT NO EXTRA TEXT OR COMMENTS
`;
  }

  /**
   * Save questions to JSON file
   */
  async saveQuestions(questions: Questions): Promise<void> {
    try {
      console.log('📝 Saving questions to file...');
      
      // Ensure directory exists
      const dir = path.dirname(this.questionsPath);
      await fs.mkdir(dir, { recursive: true });
      
      // Write questions file
      await fs.writeFile(this.questionsPath, JSON.stringify(questions, null, 2));
      console.log(`✅ Questions saved: ${this.questionsPath}`);
      
    } catch (error) {
      console.error('❌ Error saving questions:', error);
      throw error;
    }
  }

  /**
   * Update the logic file with new content
   */
  async updateLogicFile(newLogic: string): Promise<void> {
    try {
      console.log('📝 Updating logic file...');
      
      // Create backup of current file
      const backupPath = `${this.outputPath}.backup.${Date.now()}`;
      try {
        const currentContent = await fs.readFile(this.outputPath, 'utf-8');
        await fs.writeFile(backupPath, currentContent);
        console.log(`💾 Backup created: ${backupPath}`);
      } catch (error) {
        console.log('ℹ️  No existing file to backup');
      }

      // Cleanup prompt
      const cleaned = newLogic.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '');

      // Write new logic
      await fs.writeFile(this.outputPath, cleaned);
      console.log(`✅ Logic file updated: ${this.outputPath}`);
      
      // Validate TypeScript syntax
      await this.validateTypeScript(cleaned);
      
    } catch (error) {
      console.error('❌ Error updating logic file:', error);
      throw error;
    }
  }

  /**
   * Basic TypeScript syntax validation
   */
  private async validateTypeScript(content: string): Promise<void> {
    // Basic validation - check for common syntax issues
    const issues: string[] = [];
    
    if (!content.includes('export')) {
      issues.push('Missing export statement');
    }
    
    if (!content.includes('generatePersonalizedTasks')) {
      issues.push('Missing generatePersonalizedTasks function');
    }
    
    if (!content.includes('UserProfile')) {
      issues.push('Missing UserProfile type reference');
    }

    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      issues.push('Mismatched braces');
    }

    if (issues.length > 0) {
      console.warn('⚠️  Potential issues detected:', issues);
    } else {
      console.log('✅ Basic TypeScript validation passed');
    }
  }

  /**
   * Main update process - now includes questions generation
   */
  async updateLogic(): Promise<void> {
    try {
      console.log('🚀 Starting Bridge logic update process...');
      
      // 1. Scrape current regulations
      const regulations = await this.scrapeRegulations();

      // 2. Generate questions based on regulations
      console.log('📋 Generating questions based on regulations...');
      const questions = await this.generateQuestionsWithLLM(regulations);
      
      // 3. Save questions to file
      await this.saveQuestions(questions);
      
      // 4. Read current logic file
      let currentLogic = '';
      try {
        console.log(`📂 Reading current logic file from: ${this.outputPath}`);
        currentLogic = await fs.readFile(this.outputPath, 'utf-8');
      } catch (error) {
        console.log('ℹ️  No existing logic file found');
      }
      
      // 5. Generate new logic with LLM based on questions and regulations
      const newLogic = await this.generateLogicWithLLM(regulations, questions, currentLogic);
      console.log(newLogic)
      
      // 6. Update the logic file
      await this.updateLogicFile(newLogic);
      
      // 7. Save regulation metadata
      await this.saveRegulationMetadata(regulations);
      
      console.log('✅ Bridge logic and questions update completed successfully!');
      
    } catch (error) {
      console.error('❌ Update process failed:', error);
      throw error;
    }
  }

  /**
   * Save regulation metadata for tracking
   */
  private async saveRegulationMetadata(regulations: ScrapedRegulations): Promise<void> {
    const metadataPath = './regulation-metadata.json';
    await fs.writeFile(metadataPath, JSON.stringify(regulations, null, 2));
    console.log(`📋 Regulation metadata saved: ${metadataPath}`);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const htmlUrl = args[0] || process.env.REGULATIONS_URL;
  const logicPath = args[1] || './components/logic/logic.tsx';
  const questionsPath = args[2] || './public/locales/en/questions.json';

  if (!htmlUrl) {
    console.error('❌ Please provide the HTML regulations URL as first argument or REGULATIONS_URL env var');
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ Please set ANTHROPIC_API_KEY environment variable');
    process.exit(1);
  }

  const scraper = new RegulationScraper(htmlUrl, logicPath, questionsPath);
  
  try {
    await scraper.updateLogic();
    process.exit(0);
  } catch (error) {
    console.error('❌ Process failed:', error);
    process.exit(1);
  }
}

// Export for use as module
export { RegulationScraper };

// Run if called directly
if (require.main === module) {
  main();
}