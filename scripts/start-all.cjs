const { spawn } = require('child_process')
const path = require('path')

const root = path.join(__dirname, '..')
const server = spawn(process.execPath, [path.join(root, 'server', 'server.cjs')], { cwd: root, stdio: 'inherit' })
const vite = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev'], { cwd: root, stdio: 'inherit' })

function stop() {
  server.kill()
  vite.kill()
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
