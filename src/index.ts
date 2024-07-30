import awsLambdaFastify from '@fastify/aws-lambda';

import { config } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';
import { env } from 'process';

const envDir = join(env.PWD || __dirname, `/.env`);

console.log('envDir', envDir);
if (existsSync(envDir)) {
    config({ path: envDir });
} else {
    console.error('Not Found .env file');
}

import app from './app';
if (require.main === module) {
    // called directly i.e. "node app"
    app.listen({ port: 3000 }, (err, address) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log(`Server started in  ${process.uptime()}s`);
        console.log(`Server listening at ${address}`);
    });
} else {
    // required as a module => executed on aws lambda
    exports.handler = awsLambdaFastify(app);
}
