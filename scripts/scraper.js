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
    requiredLogicPath = './components/requirementLogic/logic.tsx',
    questionsPath = './public/locales/en/questions.json',
    tasksPath = './public/locales/en/tasks.json',
    model = 'claude-3-haiku-20240307' // Cheapest model, but you can use a different one if needed
    // model = 'claude-3-5-haiku-20241022' //
    // model = 'claude-3-5-sonnet-20240620' // Use the latest model for better performance
  ) {
    this.htmlUrl = htmlUrl;
    this.outputPath = outputPath;
    this.requiredLogicPath = requiredLogicPath;
    this.questionsPath = questionsPath;
    this.tasksPath = tasksPath;
    this.model = model;
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
          model: `${this.model}`,
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
          model: `${this.model}`,
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
   * Call LLM to generate new logic based on regulations, questions, and tasks
   */
  async generateWithLLM(prompt) {
    
    try {
      console.log('🤖 Calling LLM to generate...');
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: `${this.model}`,
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

      console.log('✅ Generated from LLM');
      return newLogic;
    } catch (error) {
      console.error('❌ Error calling LLM:', error);
      throw error;
    }
  }

  /**
   * Build the prompt for generating questions
   */
  buildQuestionsPrompt(regulations) {
return `# TASK: Generate intake questions for Belgian seasonal worker administrative requirements

## ROLE
You are an expert in Belgian administrative procedures for foreign workers.

## CONTEXT
Bridge is an app that helps foreign seasonal workers navigate Belgian bureaucracy by providing personalized task lists based on their situation.

## COMPLETE REGULATIONS
${regulations.regulations.map(reg => `${reg.id}. ${reg.content}`).join('\n')}

## BRIDGE APP CONTEXT
- The app helps foreign seasonal workers understand what administrative tasks they need to complete
- Tasks include: municipality registration, employment contracts, health insurance, residence documents, emergency contacts, bank accounts, and practical information
- Different requirements apply based on EU vs non-EU citizenship, work duration, location, and other factors

## OBJECTIVE
Based on the current Belgian regulations provided above, generate intake questions that will help determine what administrative tasks each foreign worker needs to complete.

## REQUIREMENTS
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

## OUTPUT FORMAT
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

## CRITICAL CONSTRAINTS
- Return ONLY the JSON object, no additional text or explanation
- Use sequential numbers as keys starting from "0"
- Ensure the JSON is valid and properly formatted
- Base all questions on the actual regulations provided
- Make sure questions help determine administrative requirements for foreign workers in Belgium`;
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

 return `# TASK: Generate administrative procedure tasks for eligible Belgian seasonal workers

## ROLE
You are an expert in Belgian administrative procedures for foreign seasonal workers and a TypeScript developer.

## CONTEXT
Bridge is an app that helps foreign seasonal workers navigate Belgian bureaucracy by providing personalized task lists based on their situation.

**IMPORTANT SCOPE LIMITATION**: Create tasks for ADMINISTRATIVE PROCEDURES that eligible users need to complete. Do NOT create tasks for eligibility verification or blocking conditions (these are handled separately in the requirements logic).

## COMPLETE REGULATIONS
${regulations.regulations.map(reg => `${reg.id}. ${reg.content}`).join('\n')}

## GENERATED QUESTIONS
${questionsList}

## CURRENT TASKS EXAMPLE
${currentTasks ? `\`\`\`json\n${currentTasks}\n\`\`\`` : `{
  "tasks": {
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
    }
  }
}`}

## OBJECTIVE
Extract ADMINISTRATIVE PROCEDURES and ACTIONABLE TASKS from the regulations that eligible users can complete to fulfill seasonal work requirements.

## TASK INCLUSION CRITERIA
✅ **DO CREATE TASKS FOR:**
- Document submission and processing
- Registration procedures (municipal, tax, health insurance)
- Permit applications and renewals
- Banking and financial setup
- Housing and accommodation procedures
- Employment contract processing
- Insurance arrangements

❌ **DO NOT CREATE TASKS FOR:**
- Eligibility verification or checking if someone qualifies
- Blocking conditions or requirements that prevent someone from working
- Initial screening or assessment processes
- Tasks that determine if someone is allowed to apply

## TASK STRUCTURE REQUIREMENTS
- **title**: Clear, concise task name for the administrative procedure
- **description**: Brief explanation of what administrative action needs to be taken
- **icon**: ONLY choose from: "FileText", "Building", "Shield", "CreditCard", "MapPin", "Briefcase"
- **steps**: Array of 2-5 actionable steps to complete the administrative procedure
- **documents**: Array of required documents/information needed for the procedure
- **estimatedTime**: Realistic time estimate (e.g., "30 minutes", "1 hour", "2-3 days")

## ICON GUIDELINES
- **FileText**: Documentation/paperwork submission tasks
- **Building**: Municipal/government office procedures
- **Shield**: Insurance/protection registration
- **CreditCard**: Banking/financial setup tasks
- **MapPin**: Location/residence registration
- **Briefcase**: Employment/work permit procedures

## OUTPUT FORMAT
Return ONLY a valid JSON object in this exact structure:

{
  "tasks": {
    "descriptive_task_id": {
      "title": "Administrative Task Title",
      "description": "Description of the administrative procedure",
      "icon": "Building",
      "steps": [
        "Step 1 for completing the procedure",
        "Step 2 for completing the procedure",
        "Step 3 for completing the procedure"
      ],
      "documents": [
        "Required document 1",
        "Required document 2"
      ],
      "estimatedTime": "1 hour"
    }
  }
}

## CRITICAL CONSTRAINTS
- Return ONLY the JSON object, no additional text or explanation
- Ensure the JSON is valid and properly formatted
- Base all tasks on ADMINISTRATIVE PROCEDURES from the complete regulations provided
- Focus on actionable bureaucratic tasks, not eligibility verification
- Use descriptive task IDs that clearly indicate the administrative procedure
- Include all procedural tasks mentioned or implied in the regulations`;
  }

  /**
   * Build the prompt for generating logic based on questions and tasks
   */
  buildLogicPrompt(regulations, questions, tasks, currentLogic, currentLogic2) {
    // Build question mapping documentation
    const questionMapping = Object.entries(questions.intakeQuestions)
      .map(([index, q]) => {
        const optionsList = q.options.map((option, optIndex) => `  - ${optIndex}: "${option}"`).join('\n');
        return `- answers[${index}]: ${q.question}\n${optionsList}`;
      })
      .join('\n\n');

    // Build available tasks list
    const availableTasks = Object.keys(tasks.tasks).join(', ');

    return `# TASK: Generate task assignment logic for eligible Belgian seasonal workers

## ROLE
You are an expert TypeScript developer working on a Belgian administrative guidance app called "BRIDGE".

## CONTEXT
Bridge helps foreign seasonal workers navigate Belgian bureaucracy by providing personalized task lists based on their situation.

## SCOPE DEFINITION
**CRITICAL**: This function handles TASK ASSIGNMENT for users who have ALREADY PASSED the eligibility requirements. The eligibility blocking conditions (absolute deal-breakers like citizenship restrictions, age limits, missing mandatory prerequisites) are handled separately in the generateRequirements function.

Your role is to determine WHICH ADMINISTRATIVE TASKS each eligible user needs to complete based on their specific situation.

## CURRENT LOGIC FILE
\`\`\`typescript
${currentLogic}
\`\`\`

## CURRENT REQUIREMENTS LOGIC (for reference - DO NOT DUPLICATE)
\`\`\`typescript
${currentLogic2}
\`\`\`

## COMPLETE REGULATIONS
${regulations.regulations.map(reg => `${reg.id}. ${reg.content}`).join('\n')}

## COMPLETE QUESTION MAPPING
${questionMapping}

## AVAILABLE TASKS
${availableTasks}

## USER PROFILE STRUCTURE
The user answers are stored in a UserProfile.answers array where each index corresponds to a question as mapped above.

## OBJECTIVE
Analyze the updated regulations and generate task assignment logic that determines which administrative tasks each eligible user needs based on their specific situation.

## FOCUS AREAS FOR TASK ASSIGNMENT
✅ **CONDITIONAL REQUIREMENTS (include these):**
- Different paperwork for EU vs non-EU workers (but both are eligible)
- Additional steps for longer work periods
- Regional-specific procedures
- Different documentation requirements based on employment type
- Optional vs mandatory registrations

❌ **ELIGIBILITY BLOCKING (exclude these - handled elsewhere):**
- Do not check if someone is completely ineligible to work
- Do not block users based on citizenship, age, or fundamental prerequisites
- Assume all users reaching this function are eligible for seasonal work

## IMPLEMENTATION REQUIREMENTS
1. Update the generatePersonalizedTasks function logic to assign appropriate tasks
2. Access user responses via profile.answers[questionIndex] using exact indices from mapping above
3. Consider task variations based on:
   - EU vs non-EU worker procedures (different tasks, not eligibility)
   - Work duration thresholds affecting required documentation
   - Regional differences in administrative procedures
   - Employment contract status affecting next steps
   - Banking and residence setup requirements
4. Maintain existing TypeScript structure and imports
5. Add detailed comments explaining regulatory basis for task assignment decisions
6. Return task IDs from available tasks list only

## OUTPUT FORMAT
Return ONLY the complete TypeScript file content with:
- Proper imports maintained
- Updated generatePersonalizedTasks function
- Detailed comments explaining task assignment logic based on regulations
- Logic using profile.answers[index] with exact question indices
- Return array of task IDs from available tasks list

## CRITICAL CONSTRAINTS
- Return ONLY the complete TypeScript file content
- Keep the existing import structure
- Focus on TASK ASSIGNMENT logic, not eligibility blocking
- Use exact question indices from the mapping provided
- Add comments explaining why certain tasks are assigned based on user situation
- Assume all users are eligible (blocking is handled elsewhere)
- ONLY choose task IDs from the available tasks list provided

RETURN ONLY THE COMPLETE TYPESCRIPT FILE CONTENT, NO ADDITIONAL TEXT OR COMMENTS`;
  }


 /**
 * Build the prompt for generating logic based on questions and tasks
 */
buildRequiredLogicPrompt(regulations, questions) {
  // Build question mapping documentation
  const questionMapping = Object.entries(questions.intakeQuestions)
    .map(([index, q]) => {
      const optionsList = q.options.map((option, optIndex) => `  - ${optIndex}: "${option}"`).join('\n');
      return `- answers[${index}]: ${q.question}\n${optionsList}`;
    })
    .join('\n\n');


return `# TASK: Generate eligibility blocking logic for Belgian seasonal workers

## ROLE
You are an expert TypeScript developer working on a Belgian administrative guidance app called "BRIDGE".

## CONTEXT
Bridge helps foreign seasonal workers navigate Belgian bureaucracy. Before generating personalized tasks, we need to determine if a user meets the MINIMUM ELIGIBILITY REQUIREMENTS to work as a seasonal worker in Belgium.

**CRITICAL DISTINCTION**: Only block users for IMMUTABLE CONDITIONS that cannot be resolved through administrative tasks or procedures.

## COMPLETE REGULATIONS
${regulations.regulations.map(reg => `${reg.id}. ${reg.content}`).join('\n')}

## COMPLETE QUESTION MAPPING
${questionMapping}

## OBJECTIVE
Create a TypeScript function called \`generateRequirements\` that identifies ONLY IMMUTABLE BLOCKING CONDITIONS that would prevent a foreign worker from being eligible for seasonal work in Belgium.

## FUNCTION SPECIFICATION
**Parameters:**
- \`currentQuestionIndex: number\` - The index of the question being answered
- \`answerIndex: number\` - The index of the selected answer option

**Return Value:**
- \`boolean\` - Returns \`true\` if the user FAILS to meet minimum requirements (blocking condition)

## BLOCKING vs NON-BLOCKING CONDITIONS

### ✅ BLOCK USERS FOR (IMMUTABLE CONDITIONS):
- **Citizenship restrictions**: Absolute prohibitions for certain nationalities
- **Age restrictions**: Hard minimum/maximum age limits set by law
- **Legal status**: Prohibited immigration status that cannot be changed
- **Criminal prohibitions**: Legal bars due to criminal history
- **Health restrictions**: Medical conditions that legally prohibit work
- **Time restrictions**: Already exceeded maximum allowed work periods
- **Geographic restrictions**: Not allowed to work in specific regions by law

### ❌ DO NOT BLOCK USERS FOR (RESOLVABLE CONDITIONS):
- **Missing documents**: Can be obtained through tasks (passport, permits, etc.)
- **No health insurance**: Can be acquired through administrative tasks
- **No bank account**: Can be opened through tasks
- **No employment contract**: Can be arranged through procedures
- **No housing**: Can be found through administrative processes
- **Missing registrations**: Can be completed through municipal tasks
- **Incomplete applications**: Can be submitted through proper procedures
- **Missing permits**: Can be applied for if eligible
- **No tax registration**: Can be completed through administrative tasks

## IMPLEMENTATION REQUIREMENTS
1. Analyze the complete regulations to identify ONLY IMMUTABLE BARRIERS
2. Use the exact question indices from the complete mapping above
3. Each condition should check: \`if (currentQuestionIndex === X && answerIndex === Y)\`
4. Add detailed comments explaining WHY each condition is IMMUTABLE based on the regulations
5. Be VERY CONSERVATIVE - only block for things that absolutely cannot be fixed through any administrative process
6. Default to allowing users to continue unless there's a clear immutable barrier

## EXAMPLES OF PROPER BLOCKING LOGIC:

\`\`\`typescript
// CORRECT - Immutable condition
if (currentQuestionIndex === 0 && answerIndex === 2) { // "Country X citizenship"
  return true; // Block - Regulation 5 explicitly prohibits Country X nationals
}

// INCORRECT - Resolvable through tasks
if (currentQuestionIndex === 1 && answerIndex === 0) { // "No health insurance"
  return true; // DON'T DO THIS - health insurance can be obtained through tasks
}
\`\`\`

## OUTPUT FORMAT
Return ONLY the complete TypeScript function:

\`\`\`typescript
export const generateRequirements = (currentQuestionIndex: number, answerIndex: number): boolean => {
  // Check ONLY immutable eligibility requirements that cannot be resolved through administrative tasks
  
  // IMPORTANT: Only block for conditions that are impossible to change or resolve
  // Examples: citizenship restrictions, age limits, legal prohibitions
  
  // [Add your logic here - be extremely conservative]
  // Only include conditions from regulations that are truly immutable
  
  return false; // Default: allow user to continue unless there's an immutable barrier
};
\`\`\`

## CRITICAL CONSTRAINTS
- Base ALL logic on the actual COMPLETE REGULATIONS provided
- ONLY block users for IMMUTABLE conditions that cannot be resolved through any administrative task
- Missing documents, insurance, permits, registrations = NOT blocking (these are tasks)
- Citizenship, age, legal status restrictions = potentially blocking (if truly immutable)
- Include clear comments explaining why each condition is IMMUTABLE
- Use exact question and answer indices from the complete mapping
- Be EXTREMELY CONSERVATIVE - when in doubt, DO NOT block
- Most users should NOT be blocked - blocking should be rare exceptions

RETURN ONLY THE COMPLETE TYPESCRIPT FUNCTION, NO ADDITIONAL TEXT OR COMMENTS`;
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
  async updateLogicFile(newLogic, outputPath) {
    try {
      console.log('📝 Updating logic file...');
      
      // Create backup of current file
      const backupPath = `${outputPath}.backup.${Date.now()}`;
      try {
        const currentContent = await fs.readFile(outputPath, 'utf-8');
        await fs.writeFile(backupPath, currentContent);
        console.log(`💾 Backup created: ${backupPath}`);
      } catch (error) {
        console.log('ℹ️  No existing file to backup');
      }

      // Cleanup prompt
      const cleaned = newLogic.replace(/^.*?```typescript\n?/, '').replace(/```/g, '');
      

      // Write new logic
      await fs.writeFile(outputPath, cleaned);
      console.log(`✅ Logic file updated: ${this.outputPath}`);
      
      
    } catch (error) {
      console.error('❌ Error updating logic file:', error);
      throw error;
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

      // 3. Compare scraped regulations with metadata
      if (existingMetadata && JSON.stringify(regulations.regulations) === JSON.stringify(existingMetadata.regulations)) {
        console.log('✅ Scraped regulations are identical to existing metadata. Exiting update process.');
        return; // Exit early if no changes
      }

      // 4. Save regulation metadata
      await this.saveRegulationMetadata(regulations);

      // 5. Generate questions based on regulations
      console.log('📋 Generating questions based on regulations...');
      const questions = await this.generateQuestionsWithLLM(regulations);
      console.log(questions.intakeQuestions);

      // 6. Save questions to file
      await this.saveQuestions(questions);


      // 7. Read current required logic file 
      let currentLogic2 = '';
      try {
        console.log(`📂 Reading current required logic file from: ${this.requiredLogicPath}`);
        currentLogic2 = await fs.readFile(this.requiredLogicPath, 'utf-8');
      } catch (error) {
        console.log('ℹ️  No existing required logic file found');
      }

      console.log(currentLogic2)

      //8. Generate new required logic with LLM
      const requiredLogicPrompt = this.buildRequiredLogicPrompt(regulations, questions);
      console.log('🤖 Generating required logic with LLM...');
      const newRequiredLogic = await this.generateWithLLM(requiredLogicPrompt);
      console.log(newRequiredLogic)

      // 9. Update the required logic file
      await this.updateLogicFile(newRequiredLogic, this.requiredLogicPath);

      
      // 10. Generate tasks based on regulations and questions
      console.log('📋 Generating tasks based on regulations...');
      const tasks = await this.generateTasksWithLLM(regulations, questions);
      console.log(tasks.tasks);

      // 11. Save tasks to file
      await this.saveTasks(tasks);


      
      // 12. Read current logic file
      let currentLogic = '';
      try {
        console.log(`📂 Reading current logic file from: ${this.outputPath}`);
        currentLogic = await fs.readFile(this.outputPath, 'utf-8');
      } catch (error) {
        console.log('ℹ️  No existing logic file found');
      }
      
      // 13. Generate new logic with LLM based on questions, tasks, and regulations
      const logicPrompt = this.buildLogicPrompt(regulations, questions, tasks, currentLogic, currentLogic2);
      console.log('🤖 Generating new logic with LLM...');
      const newLogic = await this.generateWithLLM(logicPrompt);
      console.log(newLogic)
      // 14. Update the logic file
      await this.updateLogicFile(newLogic, this.outputPath);

      
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
  const requiredLogicPath = args[2] || './components/requirementLogic/logic.tsx';
  const questionsPath = args[3] || './public/locales/en/questions.json';
  const tasksPath = args[4] || './public/locales/en/tasks.json';

  if (!htmlUrl) {
    console.error('❌ Please provide the HTML regulations URL as first argument or REGULATIONS_URL env var');
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ Please set ANTHROPIC_API_KEY environment variable');
    process.exit(1);
  }

  const scraper = new RegulationScraper(htmlUrl, logicPath, requiredLogicPath, questionsPath, tasksPath);
  
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