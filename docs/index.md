# Release {{ site.github.latest_release.tag_name }}

{{ site.github.latest_release.body }}

OS | File
-- | --{% for asset in site.github.latest_release.assets %}
  {% if asset.name contains ".yml" -%}
  {%- else -%}
    {{asset.name}} | [{{ asset.name }}]({{ asset.browser_download_url }})
  {%- endif -%}
{% endfor %}


<div style="display: none">
{{ site.github.latest_release }}
</div>
