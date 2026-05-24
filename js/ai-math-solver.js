// ╔══════════════════════════════════════════════════╗
// ║         AI MATH SOLVER - GITHUB MODELS           ║
// ║  Platform: ExploreMath                           ║
// ║  Creator: Ilyes Jeridi                           ║
// ╚══════════════════════════════════════════════════╝

const MATH_AI = {
  apiEndpoint: 'https://api.github.com/models/completions',
  model: 'gpt-4o',
  creator: 'Ilyes Jeridi',
  platform: 'ExploreMath',
  
  // Get GitHub token from localStorage (user needs to set it)
  getToken() {
    return localStorage.getItem('gh_models_token');
  },
  
  // Set GitHub token
  setToken(token) {
    localStorage.setItem('gh_models_token', token);
  },
  
  // Format message with context
  formatPrompt(problemText) {
    return `You are a helpful math tutor from the ${this.platform} platform, created by ${this.creator}.

Your role is to:
1. Solve the given math problem step-by-step
2. Explain each step clearly
3. Show all calculations
4. Provide the final answer

Format your response as:
**Problem:** [Restate the problem]
**Solution Steps:**
1. [First step]
2. [Second step]
... (etc)
**Final Answer:** [Answer with units if applicable]
**Explanation:** [Brief explanation of the method used]

Math Problem to solve:
${problemText}`;
  },
  
  // Call GitHub Models API
  async solveProblem(problemText, onProgress) {
    const token = this.getToken();
    
    if (!token) {
      throw new Error('GitHub token not configured. Please set your GitHub Models token in settings.');
    }
    
    if (!problemText || problemText.trim().length === 0) {
      throw new Error('Please enter a math problem to solve.');
    }
    
    try {
      const prompt = this.formatPrompt(problemText);
      
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'ExploreMath-AI-Solver'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `You are an expert math tutor from ${this.platform}, created by ${this.creator}. You solve complex math problems with clear, step-by-step explanations.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
          top_p: 1
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `API Error: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        solution: data.choices[0].message.content,
        model: this.model,
        creator: this.creator,
        platform: this.platform,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('AI Solver Error:', error);
      throw error;
    }
  },
  
  // Verify token is valid
  async verifyToken() {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
};

// Export for use in HTML
window.MATH_AI = MATH_AI;
