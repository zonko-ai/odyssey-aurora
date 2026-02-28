# Layouts

Single fullscreen layout. No nav, no sidebar, no header, no footer.

## App Shell (`index.html`)

```html
<div id="app">
  <video id="world" autoplay playsinline muted></video>
  <div id="prompt-area">
    <form id="prompt-form">
      <input id="prompt-input" type="text" placeholder="Describe a world…" autocomplete="off" spellcheck="false" />
    </form>
    <div id="loader"><div id="loader-line"></div></div>
  </div>
  <div id="esc-hint">esc</div>
  <div id="error-toast"></div>
</div>
```
