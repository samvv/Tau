
import { createRoot } from "react-dom/client"

import { spawnNeovim } from "./nvim"

import NeovimEditor from "./components/NeovimEditor"

(async function () {

  const rootElement = document.createElement('div');

  document.body.appendChild(rootElement);

  const root = createRoot(rootElement);

  const client = await spawnNeovim();

  console.log(await client.line)

  function View() {
    return (
      <NeovimEditor client={client} />
    );
  }

  root.render(<View />);

  if (isDebug) {
    setTimeout(() => { rootElement.focus(); }, 1000);
  }

})();
