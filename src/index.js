"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tl = require("azure-pipelines-task-lib/task");
const fs_1 = __importDefault(require("fs"));
const variableNameRegex = /(?<=\$\()[a-zA-Z0-9_]+?(?=\))/g;
function run() {
    return __awaiter(this, void 0, void 0, function* () {
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
            }
            else {
                // Read file
                let filecontent = fs_1.default.readFileSync(filepath, 'utf-8');
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
                        }
                        else {
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
                }
                else {
                    tl.setResult(tl.TaskResult.Failed, 'File not content variables in format: $([a-zA-Z0-9_]+)');
                }
            }
        }
        catch (err) {
            tl.setResult(tl.TaskResult.Failed, err.message);
        }
    });
}
run();
