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

class RegulationScraper {
  private htmlUrl: string;
  private outputPath: string;

  constructor(htmlUrl: string, outputPath: string = '.components/logic/logic.tsx') {
    this.htmlUrl = htmlUrl;
    this.outputPath = outputPath;
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
   * Call LLM to generate new logic based on regulations
   */
  async generateLogicWithLLM(regulations: ScrapedRegulations, currentLogic: string): Promise<string> {
    const prompt = this.buildLLMPrompt(regulations, currentLogic);
    
    try {
      console.log('🤖 Calling LLM to generate new logic...');
      
      // Using Anthropic Claude API - replace with your preferred LLM service
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
   * Build the prompt for the LLM
   */
  private buildLLMPrompt(regulations: ScrapedRegulations, currentLogic: string): string {
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

TASK DEFINITIONS FROM BRIDGE APP:
- municipality: Municipal registration at town hall
- contract: Employment contract & plukkaart (seasonal work permit)
- health: Health insurance arrangement
- bijlage3: Temporary residence document (Annex 3)
- emergency: Emergency contact setup
- bank: Belgian bank account opening
- practical: Practical information and worker rights

USER PROFILE STRUCTURE:
- europeanID: "0" (No EU ID) or "1" (Has EU ID)
- contract: "0" (No contract) or "1" (Has contract)
- plukkaart: "0" (No plukkaart), "1" (Has plukkaart), "2" (Don't know what it is)
- duration: "0" (<3 months), "1" (3-6 months), "2" (>6 months), "3" (Not sure)
- workProvince: "0"-"7" (Antwerp, Limburg, East Flanders, West Flanders, Flemish Brabant, Brussels, Walloon, Not sure)
- bankAccount: "0" (Need to open), "1" (Already have), "2" (Use foreign account)

The numbers must be strings, not integers.

INSTRUCTIONS:
1. Analyze the updated regulations for changes in Belgian work permit requirements
2. Update the generatePersonalizedTasks function logic based on new regulations
3. Pay special attention to:
   - EU vs non-EU worker requirements
   - Work duration thresholds (90 days rule, single permit requirements)
   - Regional differences (Flanders vs Wallonia vs Brussels)
   - Seasonal work permit (plukkaart) requirements
   - Banking and residence requirements

4. Maintain the existing TypeScript structure and imports
5. Only include tasks that are actually required based on the regulations
6. Add comments explaining the regulatory basis for each decision

IMPORTANT: 
- Return ONLY the complete TypeScript file content
- Keep the existing import structure
- Ensure all logic is based on the current Belgian regulations provided
- Focus on work permits, residence requirements, and mandatory registrations

Based on the regulations above, generate the updated logic.tsx file:

RETURN ONLY THE UPDATED LOGIC FILE CONTENT NO EXTRA TEXT OR COMMENTS
`;
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

      //Cleanup prompt
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
   * Main update process
   */
  async updateLogic(): Promise<void> {
    try {
      console.log('🚀 Starting Bridge logic update process...');
      
      // 1. Scrape current regulations
      const regulations = await this.scrapeRegulations();

      // 2. Read current logic file
      let currentLogic = '';
      try {
        console.log(`📂 Reading current logic file from: ${this.outputPath}`) ;
        currentLogic = await fs.readFile(this.outputPath, 'utf-8');
      } catch (error) {
        console.log('ℹ️  No existing logic file found');
//         currentLogic = `import { UserProfile } from "@/types";

// export const generatePersonalizedTasks = (profile: UserProfile): string[] => {
//   const allTasks = [];
//   // Default implementation
//   allTasks.push('municipality', 'health', 'practical');
//   return allTasks;
// };`;
       }
      
      // 3. Generate new logic with LLM
      const newLogic = await this.generateLogicWithLLM(regulations, currentLogic);
      console.log('🤖 New logic generated successfully!');
      // 4. Update the logic file
      await this.updateLogicFile(newLogic);
      
      // 5. Save regulation metadata
      await this.saveRegulationMetadata(regulations);
      
      console.log('✅ Bridge logic update completed successfully!');
      
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

  if (!htmlUrl) {
    console.error('❌ Please provide the HTML regulations URL as first argument or REGULATIONS_URL env var');
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ Please set ANTHROPIC_API_KEY environment variable');
    process.exit(1);
  }

  const scraper = new RegulationScraper(htmlUrl, logicPath);
  
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