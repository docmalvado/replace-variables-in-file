import tl = require('azure-pipelines-task-lib/task');
import fs from 'fs';
const variableNameRegex = /(?<=\$\()[a-zA-Z0-9_]+?(?=\))/g

async function run() {
    try {
        // Get input
        const filepath = tl.getInput('filepath', true) || "";
        const contentToVariable = tl.getInput('contentToVariable', true) === "true";
        const variableName = tl.getInput('variableName', false) || "";
        const endWithNewLine = tl.getInput('endWithNewLine', false) === "true";
        const verbose = tl.getInput('verbose', false) === "true";

        if (verbose) {
            console.log('VERBOSE LOGGING');
            console.log('----------------');
            console.log(`'filepath': ${filepath}`);
            console.log(`'endWithNewLine': ${endWithNewLine}`);
            console.log('');
        }

        // Validate file exist
        if (!tl.exist(filepath)) {
            tl.setResult(tl.TaskResult.Failed, 'File not exist');
        } else {
            // Read file
            let filecontent = fs.readFileSync(filepath, 'utf-8');
            let variables = Array.from(new Set(filecontent.match(variableNameRegex) || []));
            if (verbose) {
                console.info('=== File Content ===');
                console.info(filecontent);
                console.info('====================');
                console.log(`'filecontent.length': ${filecontent.length}`);
                console.log('');
                console.info(`'Variables in file': ${variables}`);
                console.log('');
            }
            if (variables.length > 0) {
                let processedContent = filecontent;
                variables.forEach(varName => {
                    let varValue = tl.getVariable(varName);
                    if (varValue !== null && varValue !== undefined) {
                        let variableRegex = new RegExp("\\$\\(" + varName + "\\)", 'g');
                        processedContent = processedContent.replace(variableRegex, varValue);
                    } else {
                        console.warn(`The variable $(${varName}) not exist in pipeline variables or is out of scope`);
                    }
                });
                if (endWithNewLine) {
                    processedContent = processedContent + "\n";
                }
                // Create the file
                tl.writeFile(filepath, processedContent, 'utf8');
                if (contentToVariable) {
                    tl.setVariable(variableName, processedContent, false);
                }
                tl.setResult(tl.TaskResult.Succeeded, 'File processed');
            } else {
                tl.setResult(tl.TaskResult.Failed, 'File not content variables in format: $([a-zA-Z0-9_]+)');
            }
        }
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();