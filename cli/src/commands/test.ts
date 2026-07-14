import { MediaEngineApiClient, ApiError, JobFailedError } from '../lib/client.js';
import { resolveApiKey, resolveBaseUrl } from '../lib/config.js';
import { print, printErr, fmt, spinner } from '../lib/output.js';

const TEST_PROMPT = 'A vibrant sunset over a calm ocean — MediaEngine connectivity test';

export async function runTest(): Promise<void> {
  print(fmt.header('MediaEngine connectivity test'));

  const apiKey = resolveApiKey();
  if (!apiKey) {
    printErr(fmt.error('No API key found. Run `media-engine setup` or set MEDIAENGINE_API_KEY.'));
    process.exit(1);
  }

  const baseUrl = resolveBaseUrl();
  print(fmt.info(`API URL: ${baseUrl}`));
  print(fmt.info(`API key: ${maskKey(apiKey)}`));
  print('');

  const client = new MediaEngineApiClient(apiKey, baseUrl);

  // Step 1: submit
  const submitSpin = spinner('Submitting test image job…');
  let job;
  try {
    job = await client.createJob('image', { prompt: TEST_PROMPT });
    submitSpin.stop(fmt.success(`Job submitted (${job.mediaJobId})`));
  } catch (err) {
    submitSpin.stop();
    if (err instanceof ApiError) {
      if (err.status === 401) {
        printErr(fmt.error('Authentication failed — check your API key.'));
      } else {
        printErr(fmt.error(`API error: ${err.message} (${err.code})`));
      }
    } else {
      printErr(fmt.error(`Unexpected error: ${String(err)}`));
    }
    process.exit(1);
  }

  // Step 2: wait
  const waitSpin = spinner('Waiting for job to complete…');
  try {
    const done = await client.waitForJob(job.mediaJobId, { timeout: 180_000 });
    waitSpin.stop(fmt.success('Job completed'));
    print('');
    print(fmt.bold('Result:'));
    print(fmt.info(`Output URL: ${fmt.cyan(done.outputUrl ?? 'n/a')}`));
    if (done.estimatedCostCents != null) {
      print(fmt.dim(`Cost: $${(done.estimatedCostCents / 100).toFixed(4)}`));
    }
    print('');
    print(fmt.success('All checks passed — MediaEngine is working correctly.'));
  } catch (err) {
    waitSpin.stop();
    if (err instanceof JobFailedError) {
      printErr(fmt.error(`Test job failed: ${err.job.errorMessage ?? 'unknown error'}`));
    } else {
      printErr(fmt.error(`Unexpected error: ${String(err)}`));
    }
    process.exit(1);
  }
}

function maskKey(key: string): string {
  if (key.length <= 12) return '****';
  return `${key.slice(0, 8)}…${key.slice(-4)}`;
}
