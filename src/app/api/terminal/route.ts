import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    const { command } = await req.json();
    
    if (!command) {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 });
    }

    try {
      const { stdout, stderr } = await execAsync(command, { timeout: 30000 });
      let output = stdout;
      if (stderr) {
        output += (output ? '\n' : '') + stderr;
      }
      return NextResponse.json({ output: output.trim() || 'Command executed successfully. No output returned.' });
    } catch (err: any) {
      let output = err.stdout ? err.stdout + '\n' : '';
      output += err.stderr ? err.stderr + '\n' : '';
      return NextResponse.json({ 
        error: err.message, 
        output: output.trim()
      }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
