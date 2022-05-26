
import { neovim, Button, Panel } from "tau-ide"

export function render() {
  return (
    <Panel>
      <Button onClick={() => neovim.input('A') }>Send A!</Button>
    </Panel>
  );
}

