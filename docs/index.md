# Release {{ site.github.latest_release.tag_name }}

{{ site.github.latest_release.body }}

OS | File
-- | --
{% for asset in site.github.latest_release.assets -%}
  {%- if asset.name contains ".yml" or asset.name contains ".blockmap" %}{% else -%}
    {%- if asset.name contains ".exe" -%} Windows installer
    {%- elsif asset.name contains "-win.zip" -%} Windows 
    {%- elsif asset.name contains "-mac.zip" -%} Mac 
    {%- elsif asset.name contains ".dmg" -%} Mac
    {%- elsif asset.name contains ".rpm" -%} Linux
    {%- elsif asset.name contains ".deb" -%} Linux (Debian)
    {%- elsif asset.name contains ".snap" -%} Linux (Universal)
    {%- elsif asset.name contains ".AppImage" -%} Linux (Portable)
    {%- else -%} -
    {%- endif -%}
| [{{ asset.name }}]({{ asset.browser_download_url }})
{% endif -%}
{% endfor %}

<div style="display: none">
{{ site.github.latest_release }}
</div>
