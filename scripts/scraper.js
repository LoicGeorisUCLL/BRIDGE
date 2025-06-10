// regulation-scraper.js
const { JSDOM } = require('jsdom');
const fetch = require('node-fetch').default || require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
require('dotenv/config');
const puppeteer = require('puppeteer');

class RegulationScraper {
  constructor(
    htmlUrl, 
    outputPath = './components/logic/logic.tsx',
    questionsPath = './public/locales/en/questions.json',
    tasksPath = './public/locales/en/tasks.json'
  ) {
    this.htmlUrl = htmlUrl;
    this.outputPath = outputPath;
    this.questionsPath = questionsPath;
    this.tasksPath = tasksPath;
  }

  /**
   * Scrape regulations from the HTML website with async
   */
  async scrapeRegulations() {
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
          const results = [];
          
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
  async generateQuestionsWithLLM(regulations) {
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

      const data = await response.json();
      const questionsText = data.content[0].text;

      // Parse the JSON response
      let questions;
      try {
        // Clean up the response by removing markdown code blocks if present
        const cleanedResponse = questionsText.replace(/^```json\n?/, '').replace(/```$/, '').trim();
        questions = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('❌ Error parsing questions JSON:', parseError);
        console.log('Raw response:', questionsText);
        throw new Error('Failed to parse questions JSON from LLM response');
      }
      
      console.log(`✅ Generated ${Object.keys(questions.intakeQuestions).length} questions`);
      return questions;
    } catch (error) {
      console.error('❌ Error generating questions:', error);
      throw error;
    }
  }

  /**
   * Generate tasks using LLM based on regulations and current tasks
   */
  async generateTasksWithLLM(regulations, questions) {
    const prompt = await this.buildTasksPrompt(regulations, questions);
    
    try {
      console.log('🤖 Generating tasks based on regulations...');
      
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

      const data = await response.json();
      const tasksText = data.content[0].text;

      // Parse the JSON response
      let tasks;
      try {
        // Clean up the response by removing markdown code blocks if present
        const cleanedResponse = tasksText.replace(/^```json\n?/, '').replace(/```$/, '').trim();
        tasks = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('❌ Error parsing tasks JSON:', parseError);
        console.log('Raw response:', tasksText);
        throw new Error('Failed to parse tasks JSON from LLM response');
      }
      
      console.log(`✅ Generated ${Object.keys(tasks.tasks).length} tasks`);
      return tasks;
    } catch (error) {
      console.error('❌ Error generating tasks:', error);
      throw error;
    }
  }

  /**
   * Build the prompt for generating questions
   */
  buildQuestionsPrompt(regulations) {
    return `
You are an expert in Belgian administrative procedures for foreign workers.

CONTEXT:
Bridge is an app that helps foreign seasonal workers navigate Belgian bureaucracy by providing personalized task lists based on their situation.

UPDATED REGULATIONS:
${regulations.regulations.map(reg => `${reg.id}. ${reg.content}`).join('\n')}

BRIDGE APP CONTEXT:
- The app helps foreign seasonal workers understand what administrative tasks they need to complete
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
   * Build the prompt for generating tasks
   */
  async buildTasksPrompt(regulations, questions) {
    // Read current tasks to use as examples
    let currentTasks = '';
    try {
      const tasksContent = await fs.readFile(this.tasksPath, 'utf-8');
      currentTasks = tasksContent;
    } catch (error) {
      console.log('ℹ️  No existing tasks file found, will use default structure');
    }

    const questionsList = Object.entries(questions.intakeQuestions)
      .map(([index, q]) => `${index}. ${q.question} (Options: ${q.options.join(', ')})`)
      .join('\n');

    return `
You are an expert in Belgian administrative procedures for foreign seasonal workers and a TypeScript developer.

CONTEXT:
Bridge is an app that helps foreign seasonal workers navigate Belgian bureaucracy by providing personalized task lists based on their situation.

UPDATED REGULATIONS:
${regulations.regulations.map(reg => `${reg.id}. ${reg.content}`).join('\n')}

GENERATED QUESTIONS:
${questionsList}

TASK EXAMPLE:
  {"tasks": {
    "municipality": {
      "title": "Municipal Registration",
      "description": "Register at the town hall",
      "icon": "Building",
      "steps": [
        "Visit your local municipality",
        "Bring your documents",
        "Complete the registration process"
      ],
      "documents": [
        "Passport or ID",
        "Proof of address",
        "Employment contract"
      ],
      "estimatedTime": "1 hour"
    },
    "health": {
      "title": "Health Insurance",
      "description": "Arrange health insurance via your employer or independently",
      "icon": "Shield",
      "steps": [
        "Ask your employer about included health insurance",
        "If not covered, choose a health fund (mutualiteit)",
        "Register and submit required documents"
      ],
      "documents": [
        "Passport or ID",
        "Employment contract",
        "Municipal registration"
      ],
      "estimatedTime": "45 minutes"
    },
    "practical": {
      "title": "Practical Information",
      "description": "Useful tips for living and working in Belgium",
      "icon": "FileText",
      "steps": [
        "Understand your worker rights",
        "Learn local emergency numbers",
        "Know your employer responsibilities"
      ],
      "documents": [],
      "estimatedTime": "Variable"
    }
  }
}

TASK GENERATION REQUIREMENTS:
1. Extract all administrative tasks/requirements mentioned in the regulations
2. Create comprehensive tasks that foreign workers need to complete
3. Each task should have a descriptive ID (e.g., "municipality_registration", "work_permit_application", "tax_registration")
4. Focus on tasks that are specifically mentioned or implied in the regulations
5. Include both mandatory and conditional tasks based on different worker situations

TASK STRUCTURE REQUIREMENTS:
- title: Clear, concise task name
- description: Brief explanation of what needs to be done
- icon: ONLY choose from these options: "FileText", "Building", "Shield", "CreditCard", "MapPin", "Briefcase"
- steps: Array of 2-5 actionable steps to complete the task
- documents: Array of required documents/information needed
- estimatedTime: Realistic time estimate (e.g., "30 minutes", "1 hour", "2-3 days")

IMPORTANT GUIDELINES:
- Base tasks directly on the scraped regulations
- Use descriptive task IDs that clearly indicate the administrative procedure
- Include both existing task categories and new ones found in regulations
- Make steps specific and actionable
- List realistic document requirements
- The tasks must be logical
- Provide helpful time estimates
- Choose appropriate icons based on task type:
  * FileText: Documentation/paperwork tasks
  * Building: Municipal/government office visits
  * Shield: Insurance/protection related
  * CreditCard: Banking/financial tasks
  * MapPin: Location/residence related
  * Briefcase: Employment/work related

OUTPUT FORMAT:
Return ONLY a valid JSON object in this exact structure:

{
  "tasks": {
    "task_id_1": {
      "title": "Task Title",
      "description": "Task description",
      "icon": "Building",
      "steps": [
        "Step 1 description",
        "Step 2 description",
        "Step 3 description"
      ],
      "documents": [
        "Document 1",
        "Document 2"
      ],
      "estimatedTime": "1 hour"
    },
    "task_id_2": {
      "title": "Another Task Title",
      "description": "Another task description",
      "icon": "FileText",
      "steps": [
        "Step 1",
        "Step 2"
      ],
      "documents": [
        "Required document"
      ],
      "estimatedTime": "30 minutes"
    }
  }
}

CRITICAL:
- Return ONLY the JSON object, no additional text or explanation
- Ensure the JSON is valid and properly formatted
- Base all tasks on the actual regulations provided
- Use descriptive task IDs that clearly indicate the administrative procedure
- Include all tasks mentioned or implied in the regulations

Generate the tasks now:
`;
  }

  /**
   * Call LLM to generate new logic based on regulations, questions, and tasks
   */
  async generateLogicWithLLM(regulations, questions, tasks, currentLogic) {
    const prompt = this.buildLogicPrompt(regulations, questions, tasks, currentLogic);
    
    try {
      console.log('🤖 Calling LLM to generate new logic based on questions and tasks...');
      
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

      const data = await response.json();
      const newLogic = data.content[0].text;

      console.log('✅ Generated new logic from LLM');
      return newLogic;
    } catch (error) {
      console.error('❌ Error calling LLM:', error);
      throw error;
    }
  }

  /**
   * Build the prompt for generating logic based on questions and tasks
   */
  buildLogicPrompt(regulations, questions, tasks, currentLogic) {
    // Build question mapping documentation
    const questionMapping = Object.entries(questions.intakeQuestions)
      .map(([index, q]) => {
        const optionsList = q.options.map((option, optIndex) => `  - ${optIndex}: "${option}"`).join('\n');
        return `- answers[${index}]: ${q.question}\n${optionsList}`;
      })
      .join('\n\n');

    // Build available tasks list
    const availableTasks = Object.keys(tasks.tasks).join(', ');

    return `
You are an expert TypeScript developer working on a Belgian administrative guidance app called "BRIDGE".

CONTEXT:
Bridge helps foreign seasonal workers navigate Belgian bureaucracy by providing personalized task lists based on their situation.

CURRENT LOGIC FILE:
\`\`\`typescript
${currentLogic}
\`\`\`

UPDATED REGULATIONS:
${regulations.regulations.map(reg => `${reg.id}. ${reg.content}`).join('\n')}

GENERATED QUESTIONS AND ANSWER MAPPING:
${questionMapping}

AVAILABLE TASKS:
${availableTasks}

USER PROFILE STRUCTURE:
The user answers are stored in a UserProfile.answers array where each index corresponds to a question as mapped above.

INSTRUCTIONS:
1. Analyze the updated regulations for changes in Belgian work permit requirements
2. Update the generatePersonalizedTasks function logic based on new regulations, questions, and available tasks
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
9. Return task IDs from the available tasks list only

IMPORTANT: 
- Return ONLY the complete TypeScript file content
- Keep the existing import structure
- Ensure all logic is based on the current Belgian regulations provided
- Use profile.answers[index] to access user responses based on the question mapping provided
- Add detailed comments explaining the regulatory reasoning for each task assignment

Based on the regulations, questions, and available tasks above, generate the updated logic.tsx file:

ONLY CHOOSE TASKS FROM THE AVAILABLE TASKS LIST
RETURN ONLY THE UPDATED LOGIC FILE CONTENT NO EXTRA TEXT OR COMMENTS
`;
  }

  /**
   * Save questions to JSON file
   */
  async saveQuestions(questions) {
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
   * Save tasks to JSON file
   */
  async saveTasks(tasks) {
    try {
      console.log('📝 Saving tasks to file...');
      
      // Ensure directory exists
      const dir = path.dirname(this.tasksPath);
      await fs.mkdir(dir, { recursive: true });
      
      // Write tasks file
      await fs.writeFile(this.tasksPath, JSON.stringify(tasks, null, 2));
      console.log(`✅ Tasks saved: ${this.tasksPath}`);
      
    } catch (error) {
      console.error('❌ Error saving tasks:', error);
      throw error;
    }
  }

  /**
   * Update the logic file with new content
   */
  async updateLogicFile(newLogic) {
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
      const cleaned = newLogic.replace(/^.*?```typescript\n?/, '').replace(/```/g, '');
      

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
  async validateTypeScript(content) {
    // Basic validation - check for common syntax issues
    const issues = [];
    
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
   * Main update process - now includes task generation
   */
  async updateLogic() {
    try {
      console.log('🚀 Starting Bridge logic update process...');
      
      // 1. Scrape current regulations
      const regulations = await this.scrapeRegulations();
      console.log(regulations);

      // 2. Read existing regulation metadata
      const metadataPath = './regulation-metadata.json';
      let existingMetadata = null;
      try {
        const metadataContent = await fs.readFile(metadataPath, 'utf-8');
        existingMetadata = JSON.parse(metadataContent);
        console.log('Loaded existing regulation metadata.');
      } catch (error) {
        console.log('ℹ️  No existing regulation metadata found.');
      }

      console.log(existingMetadata)
      // // 3. Compare scraped regulations with metadata
      // if (existingMetadata && JSON.stringify(regulations.regulations) === JSON.stringify(existingMetadata.regulations)) {
      //   console.log('✅ Scraped regulations are identical to existing metadata. Exiting update process.');
      //   return; // Exit early if no changes
      // }

      // 4. Save regulation metadata
      await this.saveRegulationMetadata(regulations);

      // 5. Generate questions based on regulations
      console.log('📋 Generating questions based on regulations...');
      const questions = await this.generateQuestionsWithLLM(regulations);
      console.log(questions.intakeQuestions);

      // 6. Save questions to file
      await this.saveQuestions(questions);
      
      // 7. Generate tasks based on regulations and questions
      console.log('📋 Generating tasks based on regulations...');
      const tasks = await this.generateTasksWithLLM(regulations, questions);
      console.log(tasks.tasks);

      // 8. Save tasks to file
      await this.saveTasks(tasks);
      
      // 9. Read current logic file
      let currentLogic = '';
      try {
        console.log(`📂 Reading current logic file from: ${this.outputPath}`);
        currentLogic = await fs.readFile(this.outputPath, 'utf-8');
      } catch (error) {
        console.log('ℹ️  No existing logic file found');
      }
      
      // 10. Generate new logic with LLM based on questions, tasks, and regulations
      const newLogic = await this.generateLogicWithLLM(regulations, questions, tasks, currentLogic);
      console.log(newLogic)
      // 11. Update the logic file
      await this.updateLogicFile(newLogic);

      
      console.log('✅ Bridge logic, questions, and tasks update completed successfully!');
      
    } catch (error) {
      console.error('❌ Update process failed:', error);
      throw error;
    }
  }

  /**
   * Save regulation metadata for tracking
   */
  async saveRegulationMetadata(regulations) {
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
  const tasksPath = args[3] || './public/locales/en/tasks.json';

  if (!htmlUrl) {
    console.error('❌ Please provide the HTML regulations URL as first argument or REGULATIONS_URL env var');
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ Please set ANTHROPIC_API_KEY environment variable');
    process.exit(1);
  }

  const scraper = new RegulationScraper(htmlUrl, logicPath, questionsPath, tasksPath);
  
  try {
    await scraper.updateLogic();
    process.exit(0);
  } catch (error) {
    console.error('❌ Process failed:', error);
    process.exit(1);
  }
}

// Export for use as module
module.exports = { RegulationScraper };

// Run if called directly
if (require.main === module) {
  main();
}