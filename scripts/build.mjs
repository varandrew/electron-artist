#!/usr/bin/env zx

console.log(chalk.blue('Start building...'))

await $`rm -rf ./src/release`
await $`pnpm run build`
