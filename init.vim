
set termguicolors
set number

autocmd VimLeave * call rpcnotify(tau_rpc_channel, "quit")

