import { SkillLoader } from './apps/agent/src/skills/loader';
import { buildSystemPrompt } from './apps/agent/src/skills/prompt';

async function test() {
  const loader = new SkillLoader('./skills');
  const skills = await loader.loadAll();
  const sourceLocations = loader.getSourceLocations();
  
  console.log('=== Source Locations ===');
  console.log(JSON.stringify(sourceLocations, null, 2));
  console.log('\n=== System Prompt ===');
  const prompt = buildSystemPrompt(skills, sourceLocations);
  console.log(prompt);
}

test().catch(console.error);
