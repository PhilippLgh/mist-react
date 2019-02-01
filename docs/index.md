
# latest releases

{{ site.latest_release }}

OS | File
-- | --
{% for asset in site.github.latest_release.assets %}
  {{ asset.name }} | {{ asset.browser_download_url }}
{% endfor %}



# mist shell

This is the current test page of the Mist shell repository.

## Downloads

### 1.0.1

OS | File
-- | -- 
Mac | [Mist-1.0.3.dmg](https://github.com/ethereum/mist-shell/releases/download/untagged-3481f969b1bfb44bd2de/Mist-1.0.3.dmg)
Windows installer | [Mist-shell-setup-1.0.3.exe](https://github.com/ethereum/mist-shell/releases/download/untagged-3481f969b1bfb44bd2de/mist-shell-setup-1.0.3.exe)
Linux (.deb) | [mist-shell_1.0.3_amd64.deb](https://github.com/ethereum/mist-shell/releases/download/untagged-3481f969b1bfb44bd2de/mist-shell_1.0.3_amd64.deb)
Linux x86_64 (.rpm) | [mist-shell-1.0.3.x86_64.rpm](https://github.com/ethereum/mist-shell/releases/download/untagged-3481f969b1bfb44bd2de/mist-shell-1.0.3.x86_64.rpm)
Linux x86_64 (.AppImage) | [mist-shell-1.0.3-x86_64.AppImage](https://github.com/ethereum/mist-shell/releases/download/untagged-3481f969b1bfb44bd2de/mist-shell-1.0.3-x86_64.AppImage)
Linux amd64 (.deb) | [mist-shell_1.0.3_amd64.deb](https://github.com/ethereum/mist-shell/releases/download/untagged-3481f969b1bfb44bd2de/mist-shell_1.0.3_amd64.deb)
Linux amd64 (.snap) | [mist-shell_1.0.3_amd64.snap](https://github.com/ethereum/mist-shell/releases/download/untagged-3481f969b1bfb44bd2de/mist-shell_1.0.3_amd64.snap)
