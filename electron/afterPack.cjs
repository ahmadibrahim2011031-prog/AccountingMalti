const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

exports.default = async function afterPack({ appOutDir, packager }) {
  const resourcesApp = path.join(appOutDir, 'Malti Accounting.app', 'Contents', 'Resources', 'app')
  const src = path.join(packager.projectDir, 'node_modules', '.prisma')
  const dst = path.join(resourcesApp, 'node_modules', '.prisma')

  if (!fs.existsSync(dst) && fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(dst), { recursive: true })
    execSync(`cp -r "${src}" "${dst}"`)
    console.log('afterPack: copied .prisma/client into bundle')
  }
}
