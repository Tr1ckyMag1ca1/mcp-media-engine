import { MediaEngineApiClient, ApiError, JobFailedError } from '../lib/client.js';
import { resolveApiKey, resolveBaseUrl } from '../lib/config.js';
import { print, printErr, fmt, spinner } from '../lib/output.js';

export interface GenerateImageArgs {
  prompt: string;
  provider?: string;
  wait: boolean;
  json: boolean;
}

export async function generateImage(args: GenerateImageArgs): Promise<void> {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    printErr(fmt.error('No API key found. Run `media-engine setup` or set MEDIAENGINE_API_KEY.'));
    process.exit(1);
  }

  const client = new MediaEngineApiClient(apiKey, resolveBaseUrl());

  const spin = spinner(`Submitting image job…`);
  let job;
  try {
    job = await client.createJob(
      'image',
      { prompt: args.prompt },
      args.provider,
    );
    spin.stop(fmt.success(`Job submitted: ${fmt.bold(job.mediaJobId)}`));
  } catch (err) {
    spin.stop();
    handleApiError(err);
    return;
  }

  if (!args.wait) {
    if (args.json) {
      print(JSON.stringify(job, null, 2));
    } else {
      print(fmt.info(`Status: ${job.status}`));
      print(fmt.dim(`Poll: media-engine status ${job.mediaJobId}`));
    }
    return;
  }

  const waitSpin = spinner('Waiting for job to complete…');
  try {
    const done = await client.waitForJob(job.mediaJobId, { timeout: 180_000 });
    waitSpin.stop(fmt.success('Done'));
    if (args.json) {
      print(JSON.stringify(done, null, 2));
    } else {
      print(fmt.info(`Output URL: ${fmt.cyan(done.outputUrl ?? 'n/a')}`));
      if (done.estimatedCostCents != null) {
        print(fmt.dim(`Cost: $${(done.estimatedCostCents / 100).toFixed(4)}`));
      }
    }
  } catch (err) {
    waitSpin.stop();
    if (err instanceof JobFailedError) {
      printErr(fmt.error(`Job failed: ${err.job.errorMessage ?? 'unknown error'}`));
      process.exit(1);
    }
    handleApiError(err);
  }
}

function handleApiError(err: unknown): never {
  if (err instanceof ApiError) {
    printErr(fmt.error(`API error (${err.code}): ${err.message}`));
    if (err.status === 401) printErr(fmt.dim('Check your API key with `media-engine setup`'));
  } else {
    printErr(fmt.error(String(err)));
  }
  process.exit(1);
}
