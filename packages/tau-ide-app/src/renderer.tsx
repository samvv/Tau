
import path from "path"
import fs from "fs"
import { createRoot } from "react-dom/client"

import { spawnNeovim } from "./nvim"

import NeovimEditor from "./components/NeovimEditor"
import type { TauAPI } from "tau-ide/src/types"

window.TAU_IDE = {} as TauAPI;

async function loadPackageJson(packageJsonPath: string) {
  return JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf-8'));
}

(async function () {

  const rootElement = document.createElement('div');

  document.body.appendChild(rootElement);

  const root = createRoot(rootElement);

  const client = window.TAU_IDE.client = await spawnNeovim();

  function View() {
    return (
      <NeovimEditor client={client} />
    );
  }

  root.render(<View />);

  // FIXME This path is currently hard-coded and should be made more robust
  const packagesDir = path.resolve('..');

  // This is a really ugly hack to force Webpack to not replace our call to the
  // NodeJS 'require'-functiom
  const dynamicRequire = eval('require');

  for (const dirname of await fs.promises.readdir(packagesDir)) {
    const packageJson = await loadPackageJson(path.join(packagesDir, dirname, 'package.json'));
    if (packageJson.keywords && packageJson.keywords.indexOf('tau-ide-plugin') !== -1) {
      const plugin = dynamicRequire(path.join(packagesDir, dirname));
      console.log('here', plugin)
    }
  }

})();
