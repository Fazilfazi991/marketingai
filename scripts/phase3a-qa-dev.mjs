import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { assertQaUrl } from './qa-project-guard.mjs';
assertQaUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const require = createRequire(import.meta.url);
const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'dev', '--hostname', '127.0.0.1', '--port', '3000'], { stdio: 'inherit', windowsHide: true, env: { ...process.env, GROWTH_AGENT_ALLOW_PROVIDER_CALLS: 'false' } });
child.on('exit', code => { process.exitCode = code ?? 1; });
