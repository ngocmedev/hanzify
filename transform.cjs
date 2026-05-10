const fs = require('fs');
let code = fs.readFileSync('server/index.ts', 'utf8');

code = code.replace(/app\.(get|post|put|delete)\('([^']+)', \((req, res)\) => \{/g, "app.$1('$2', async ($3) => {");
code = code.replace(/app\.(get|post|put|delete)\('([^']+)', authenticateToken, \((req, res)\) => \{/g, "app.$1('$2', authenticateToken, async ($3) => {");
code = code.replace(/app\.(get|post|put|delete)\('([^']+)', authenticateToken, isAdmin, \((req, res)\) => \{/g, "app.$1('$2', authenticateToken, isAdmin, async ($3) => {");

code = code.replace(/db\.prepare\('([^']+)'\)\.get\((.*?)\)/g, "(await db.execute({ sql: '$1', args: [$2] })).rows[0]");
code = code.replace(/db\.prepare\(`([\s\S]+?)`\)\.get\((.*?)\)/g, "(await db.execute({ sql: `$1`, args: [$2] })).rows[0]");

code = code.replace(/db\.prepare\('([^']+)'\)\.all\((.*?)\)/g, "(await db.execute({ sql: '$1', args: [$2] })).rows");
code = code.replace(/db\.prepare\(`([\s\S]+?)`\)\.all\((.*?)\)/g, "(await db.execute({ sql: `$1`, args: [$2] })).rows");

code = code.replace(/db\.prepare\('([^']+)'\)\s*\.run\((.*?)\)/g, "await db.execute({ sql: '$1', args: [$2] })");
code = code.replace(/db\.prepare\(`([\s\S]+?)`\)\s*\.run\((.*?)\)/g, "await db.execute({ sql: `$1`, args: [$2] })");

fs.writeFileSync('server/index.ts', code);
