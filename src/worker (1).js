import{connect as e}from"cloudflare:sockets";var t=Object.defineProperty,n=(e,t)=>()=>(e&&(t=e(e=0)),t),r=(e,n)=>{for(var r in n)t(e,r,{get:n[r],enumerable:!0})},i={};r(i,{errorPage:()=>o,indexPage:()=>a,subscriptionPage:()=>s});async function a(){return new Response(c,{status:200,headers:{"Content-Type":`text/html; charset=utf-8`}})}async function o(){return new Response(l,{status:500,headers:{"Content-Type":`text/html; charset=utf-8`}})}async function s(e,t){let{splitAndFilter:n}=await Promise.resolve().then(function(){return x(),_}),{generateSubscription:r,generateVlessConfig:i}=await Promise.resolve().then(function(){return h(),d}),a=n(e.UUID||``,`,`),o=new URL(t.url),s=a.map(e=>({uuid:e,link:r(e,o),vlessJson:JSON.stringify(i(e,o),null,2)})),c=e=>e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#039;`),l=s.length>0?s[0]:null,u=`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FoxCloud Subscription</title>
  <style>
    :root {
      --primary-color: #3498db;
      --secondary-color: #2c3e50;
      --accent-color: #1abc9c;
      --light-bg: #f8f9fa;
      --dark-bg: #121212;
      --card-bg: #ffffff;
      --text-light: #f8f9fa;
      --text-dark: #212529;
      --success-color: #27ae60;
      --warning-color: #f39c12;
      --error-color: #e74c3c;
      --border-radius: 12px;
      --box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
      --transition: all 0.3s ease;
    }

    [data-theme="dark"] {
      --light-bg: #121212;
      --dark-bg: #1e1e1e;
      --card-bg: #2d2d2d;
      --text-light: #f8f9fa;
      --text-dark: #f8f9fa;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: var(--text-dark);
      background-color: var(--light-bg);
      transition: var(--transition);
      min-height: 100vh;
      padding: 1rem;
      overflow-x: hidden; /* Prevent horizontal scrolling */
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      overflow-x: hidden; /* Prevent horizontal scrolling */
    }

    header {
      text-align: center;
      margin-bottom: 1.5rem;
      padding: 1rem;
    }

    h1 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      color: var(--primary-color);
    }

    .subtitle {
      font-size: 1rem;
      opacity: 0.9;
      max-width: 600px;
      margin: 0 auto;
    }

    .theme-toggle {
      position: absolute;
      top: 15px;
      right: 15px;
      background: var(--card-bg);
      border: 2px solid var(--primary-color);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      cursor: pointer;
      transition: var(--transition);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      z-index: 100;
    }

    .theme-toggle:hover {
      transform: rotate(15deg);
    }

    .info-box {
      background: var(--card-bg);
      border-radius: var(--border-radius);
      box-shadow: var(--box-shadow);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .info-box h2 {
      color: var(--primary-color);
      margin-bottom: 1rem;
      font-size: 1.3rem;
    }

    .subscription-url-container {
      background: var(--primary-color);
      color: white;
      border-radius: var(--border-radius);
      padding: 1rem;
      margin: 1rem 0;
      word-break: break-all;
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
    }

    .cards-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
      overflow-x: hidden; /* Prevent horizontal scrolling */
    }

    .card {
      background: var(--card-bg);
      border-radius: var(--border-radius);
      box-shadow: var(--box-shadow);
      padding: 1.5rem;
      transition: var(--transition);
      display: flex;
      flex-direction: column;
      overflow-x: hidden; /* Prevent horizontal overflow */
    }

    .card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 25px rgba(0, 0, 0, 0.15);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }

    [data-theme="dark"] .card-header {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .card-title {
      font-size: 1.2rem;
      color: var(--primary-color);
    }

    .card-id {
      font-size: 0.8rem;
      background: var(--primary-color);
      color: white;
      padding: 0.2rem 0.5rem;
      border-radius: 20px;
    }

    .tabs {
      display: flex;
      gap: 0.5rem;
      margin: 1rem 0;
      overflow-x: auto;
      padding-bottom: 0.5rem;
      flex-wrap: wrap;
    }

    .tab {
      padding: 0.5rem 1rem;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 20px;
      cursor: pointer;
      white-space: nowrap;
      font-size: 0.9rem;
      flex: 1;
      text-align: center;
      min-width: 70px;
    }

    [data-theme="dark"] .tab {
      background: rgba(255, 255, 255, 0.1);
    }

    .tab.active {
      background: var(--primary-color);
      color: white;
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    .qr-container {
      display: flex;
      justify-content: center;
      margin: 1rem 0;
    }

    .qr-code {
      width: 180px;
      height: 180px;
      background: white;
      padding: 8px;
      border-radius: var(--border-radius);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .config-container {
      background: rgba(0, 0, 0, 0.03);
      border-radius: var(--border-radius);
      padding: 1rem;
      margin: 1rem 0;
      overflow-x: auto;
      font-family: 'Courier New', monospace;
      font-size: 0.75rem;
      line-height: 1.4;
      max-height: 200px;
      overflow-y: auto;
      word-break: break-all;
      white-space: pre-wrap;
    }
    
    .config-container div {
      white-space: pre-wrap;
      word-break: break-all;
      margin: 0;
      padding: 0;
    }
    
    .config-hint {
      text-align: center;
      margin-top: 0.5rem;
      font-size: 0.8rem;
      color: #666;
    }
    
    .config-container div {
      white-space: pre-wrap;
      word-break: break-all;
    }
    
    .config-container pre {
      white-space: pre-wrap;
      word-break: break-all;
      margin: 0;
      padding: 0;
    }

    [data-theme="dark"] .config-container {
      background: rgba(255, 255, 255, 0.05);
    }

    .actions {
      display: flex;
      gap: 0.75rem;
      margin-top: auto;
    }

    .btn {
      flex: 1;
      background: var(--primary-color);
      color: white;
      padding: 0.7rem 1rem;
      border-radius: var(--border-radius);
      border: none;
      cursor: pointer;
      font-weight: 500;
      transition: var(--transition);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      white-space: nowrap;
    }

    .btn:hover {
      background: var(--accent-color);
      transform: translateY(-2px);
    }

    .btn-copy {
      background: var(--success-color);
    }

    .btn-copy:hover {
      background: #219653;
    }

    .btn-sub {
      background: var(--warning-color);
    }

    .btn-sub:hover {
      background: #d48806;
    }

    .notification {
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--success-color);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: var(--border-radius);
      box-shadow: var(--box-shadow);
      transform: translateX(200%);
      transition: transform 0.3s ease;
      z-index: 1000;
      max-width: 300px;
    }

    .notification.show {
      transform: translateX(0);
    }

    .notification.error {
      background: var(--error-color);
    }

    footer {
      text-align: center;
      padding: 1.5rem 0;
      color: var(--text-dark);
      opacity: 0.7;
      font-size: 0.8rem;
    }

    @media (max-width: 768px) {
      body {
        padding: 0.5rem;
      }
      
      .cards-container {
        grid-template-columns: 1fr;
      }
      
      h1 {
        font-size: 1.5rem;
      }
      
      .subtitle {
        font-size: 0.9rem;
      }
      
      .actions {
        flex-direction: column;
      }
      
      .tab {
        min-width: 60px;
        padding: 0.4rem 0.6rem;
        font-size: 0.8rem;
      }
    }

    @media (max-width: 480px) {
      .card {
        padding: 1rem;
      }
      
      .card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
      
      .qr-code {
        width: 150px;
        height: 150px;
      }
      
      .config-container {
        font-size: 0.7rem;
        max-width: 100%;
        overflow-x: auto;
        word-break: break-all;
        white-space: pre-wrap;
        max-height: 150px; /* Reduce height on mobile */
      }
      
      .config-container div {
        white-space: pre-wrap;
        word-break: break-all;
      }
      
      .config-container pre {
        white-space: pre-wrap;
        word-break: break-all;
      }
      
      .btn {
        font-size: 0.8rem;
        padding: 0.6rem 0.8rem;
      }
      
      .tab {
        min-width: 50px;
        padding: 0.3rem 0.5rem;
        font-size: 0.75rem;
      }
      
      /* Fix for mobile VLESS tab overflow */
      .tab-content {
        overflow-x: auto;
      }
      
      /* Additional mobile improvements */
      body {
        padding: 0.5rem;
        overflow-x: hidden;
      }
      
      .container {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <button class="theme-toggle" id="themeToggle">🌓</button>
  
  <div class="container">
    <header>
      <h1>FoxCloud Subscription</h1>
      <p class="subtitle">Your secure proxy configuration is ready. Copy the configuration to import on your client.</p>
    </header>

    <!-- Removed the subscription URL card as requested -->

    <div class="cards-container">
      ${l?`
        <div class="card" data-uuid="${l.uuid}">
          <div class="card-header">
            <h2 class="card-title">🦊 VLESS Configuration</h2>
            <span class="card-id">${l.uuid.substring(0,8)}...</span>
          </div>
          
          <div class="config-container">
            <div style="white-space: pre-wrap; word-break: break-all;">${c(l.link)}</div>
          </div>
          <div class="config-hint" style="text-align: center; margin-top: 0.5rem; font-size: 0.8rem; color: #666;">
            <small>💡 On mobile devices, scroll horizontally to view the full configuration</small>
          </div>
          <div class="actions">
            <button class="btn btn-copy" data-config="${c(l.link)}">
              📋 Copy VLESS
            </button>
          </div>
        </div>
      `:``}
    </div>
    
    <footer>
      <p>FoxCloud - Secure, Fast, Global Proxy Service</p>
      <p>Running on Cloudflare Workers</p>
    </footer>
  </div>
  
  <div class="notification" id="notification">Configuration copied to clipboard!</div>

  <script>
    // Theme toggle functionality
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    });
    
    // Tab switching functionality
    // Removed tab functionality since we're only showing VLESS config now
    
    // Copy to clipboard functionality
    document.querySelectorAll('.btn-copy').forEach(button => {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        let config = button.getAttribute('data-config');
        
        if (config) {
          try {
            await navigator.clipboard.writeText(config);
            showNotification('VLESS configuration copied to clipboard!');
          } catch (err) {
            // Fallback for older browsers
            try {
              const textArea = document.createElement('textarea');
              textArea.value = config;
              textArea.style.position = 'fixed';
              textArea.style.left = '-999999px';
              textArea.style.top = '-999999px';
              document.body.appendChild(textArea);
              textArea.focus();
              textArea.select();
              document.execCommand('copy');
              document.body.removeChild(textArea);
              showNotification('VLESS configuration copied to clipboard!');
            } catch (fallbackErr) {
              showNotification('Failed to copy to clipboard!', true);
              console.error('Copy error:', fallbackErr);
            }
          }
        } else {
          showNotification('Failed to copy configuration!', true);
        }
      });
    });
    
    // Show notification
    function showNotification(message, isError = false) {
      const notification = document.getElementById('notification');
      notification.textContent = message;
      notification.className = 'notification';
      if (isError) {
        notification.classList.add('error');
      }
      notification.classList.add('show');
      setTimeout(() => {
        notification.classList.remove('show');
      }, 3000);
    }
    
    // QR Code generation using a real QR code library
    // Removed QR code generation since we're not showing QR codes anymore
  </script>
  <!-- Removed QR Code library script since we're not using it anymore -->
</body>
</html>`;return new Response(u,{status:200,headers:{"Content-Type":`text/html; charset=utf-8`}})}var c,l,u=n(()=>{c=`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to FoxCloud!</title>
  <style>
    :root {
      --primary-color: #3498db;
      --secondary-color: #2c3e50;
      --accent-color: #1abc9c;
      --light-bg: #f8f9fa;
      --dark-bg: #212529;
      --text-light: #f8f9fa;
      --text-dark: #212529;
      --success-color: #27ae60;
      --warning-color: #f39c12;
      --error-color: #e74c3c;
      --border-radius: 8px;
      --box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      --transition: all 0.3s ease;
    }

    [data-theme="dark"] {
      --light-bg: #212529;
      --dark-bg: #f8f9fa;
      --text-light: #212529;
      --text-dark: #f8f9fa;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: var(--text-dark);
      background-color: var(--light-bg);
      transition: var(--transition);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .container {
      width: 90%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    header {
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      color: white;
      padding: 2rem 0;
      box-shadow: var(--box-shadow);
      margin-bottom: 2rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
    }

    h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      font-size: 1.2rem;
      opacity: 0.9;
    }

    .theme-toggle {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      border-radius: var(--border-radius);
      color: white;
      padding: 0.5rem 1rem;
      cursor: pointer;
      transition: var(--transition);
    }

    .theme-toggle:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .card {
      background: white;
      border-radius: var(--border-radius);
      box-shadow: var(--box-shadow);
      padding: 2rem;
      margin-bottom: 2rem;
      transition: var(--transition);
    }

    [data-theme="dark"] .card {
      background: #343a40;
    }

    .card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
    }

    h2 {
      color: var(--secondary-color);
      margin-bottom: 1rem;
      font-size: 1.8rem;
    }

    [data-theme="dark"] h2 {
      color: var(--accent-color);
    }

    p {
      margin-bottom: 1rem;
    }

    a {
      color: var(--primary-color);
      text-decoration: none;
      font-weight: 500;
      transition: var(--transition);
    }

    a:hover {
      color: var(--accent-color);
      text-decoration: underline;
    }

    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin: 2rem 0;
    }

    .feature-card {
      background: white;
      border-radius: var(--border-radius);
      box-shadow: var(--box-shadow);
      padding: 1.5rem;
      transition: var(--transition);
    }

    [data-theme="dark"] .feature-card {
      background: #343a40;
    }

    .feature-card:hover {
      transform: translateY(-3px);
    }

    .feature-icon {
      font-size: 2rem;
      margin-bottom: 1rem;
      color: var(--primary-color);
    }

    .btn {
      display: inline-block;
      background: var(--primary-color);
      color: white;
      padding: 0.8rem 1.5rem;
      border-radius: var(--border-radius);
      text-decoration: none;
      font-weight: 500;
      transition: var(--transition);
      border: none;
      cursor: pointer;
      font-size: 1rem;
    }

    .btn:hover {
      background: var(--accent-color);
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    footer {
      margin-top: auto;
      text-align: center;
      padding: 2rem 0;
      color: var(--text-dark);
      border-top: 1px solid rgba(0, 0, 0, 0.1);
    }

    [data-theme="dark"] footer {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        text-align: center;
      }
      
      h1 {
        font-size: 2rem;
      }
      
      .container {
        width: 95%;
        padding: 1rem;
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <div class="header-content">
        <div>
          <h1>Welcome to FoxCloud!</h1>
          <p class="subtitle">High-performance proxy server running on Cloudflare Workers</p>
        </div>
        <button class="theme-toggle" id="themeToggle">🌓 Toggle Theme</button>
      </div>
    </div>
  </header>

  <main class="container">
    <div class="card">
      <h2>System Status</h2>
      <p>If you see this page, the FoxCloud proxy server is successfully installed and working. Further configuration is required.</p>
      
      <div class="features">
        <div class="feature-card">
          <div class="feature-icon">⚡</div>
          <h3>Lightning Fast</h3>
          <p>Built on Cloudflare's global network for minimal latency.</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">🔒</div>
          <h3>Secure</h3>
          <p>Enterprise-grade encryption and security protocols.</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">🌐</div>
          <h3>Global Network</h3>
          <p>Access from anywhere with 200+ data centers worldwide.</p>
        </div>
      </div>
      
      <a href="https://developers.cloudflare.com/workers/" class="btn">View Documentation</a>
    </div>
    
    <div class="card">
      <h2>Getting Started</h2>
      <p>For online documentation and support please refer to the official Cloudflare Workers Documentation.</p>
      <p>Commercial support is available through Cloudflare.</p>
      <p>Configure your proxy settings to begin using FoxCloud.</p>
    </div>
  </main>

  <footer>
    <div class="container">
      <p><em>Thank you for using FoxCloud.</em></p>
      <p>Version 1.0.0</p>
    </div>
  </footer>

  <script>
    // Theme toggle functionality
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    });
  </script>
</body>
</html>`,l=`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error - FoxCloud</title>
  <style>
    :root {
      --primary-color: #3498db;
      --secondary-color: #2c3e50;
      --accent-color: #1abc9c;
      --error-color: #e74c3c;
      --light-bg: #f8f9fa;
      --dark-bg: #212529;
      --text-light: #f8f9fa;
      --text-dark: #212529;
      --border-radius: 8px;
      --box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      --transition: all 0.3s ease;
    }

    [data-theme="dark"] {
      --light-bg: #212529;
      --dark-bg: #f8f9fa;
      --text-light: #212529;
      --text-dark: #f8f9fa;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: var(--text-dark);
      background-color: var(--light-bg);
      transition: var(--transition);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .container {
      width: 90%;
      max-width: 800px;
      text-align: center;
    }

    .error-card {
      background: white;
      border-radius: var(--border-radius);
      box-shadow: var(--box-shadow);
      padding: 3rem 2rem;
      margin-bottom: 2rem;
      transition: var(--transition);
    }

    [data-theme="dark"] .error-card {
      background: #343a40;
    }

    .error-icon {
      font-size: 4rem;
      color: var(--error-color);
      margin-bottom: 1.5rem;
    }

    h1 {
      color: var(--error-color);
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }

    h2 {
      color: var(--secondary-color);
      margin-bottom: 1.5rem;
      font-size: 1.8rem;
    }

    [data-theme="dark"] h2 {
      color: var(--accent-color);
    }

    p {
      margin-bottom: 1.5rem;
      font-size: 1.1rem;
    }

    .btn {
      display: inline-block;
      background: var(--primary-color);
      color: white;
      padding: 0.8rem 1.5rem;
      border-radius: var(--border-radius);
      text-decoration: none;
      font-weight: 500;
      transition: var(--transition);
      border: none;
      cursor: pointer;
      font-size: 1rem;
      margin-top: 1rem;
    }

    .btn:hover {
      background: var(--accent-color);
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    footer {
      text-align: center;
      padding: 2rem 0;
      color: var(--text-dark);
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      width: 100%;
    }

    [data-theme="dark"] footer {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    @media (max-width: 768px) {
      .error-card {
        padding: 2rem 1rem;
      }
      
      h1 {
        font-size: 2rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="error-card">
      <div class="error-icon">⚠️</div>
      <h1>Server Error</h1>
      <h2>Something went wrong</h2>
      <p>Sorry, the page you are looking for is currently unavailable.<br>
      Please try again later.</p>
      <p>If you are the system administrator of this resource then you should check the error log for details.</p>
      <button class="btn" onclick="window.location.reload()">Retry</button>
    </div>
  </div>

  <footer>
    <p><em>Faithfully yours, FoxCloud.</em></p>
  </footer>

  <script>
    // Theme toggle functionality based on system preference
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    if (prefersDarkScheme.matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  </script>
</body>
</html>`}),d={};r(d,{generateAllConfigs:()=>m,generateSubscription:()=>f,generateVlessConfig:()=>p});function f(e,t){return`vless://${e}@${t.hostname}:443?encryption=none&security=tls&sni=${t.hostname}&fp=chrome&type=ws&host=${t.hostname}&path=ws&ed=4096#${t.hostname}`}function p(e,t){return{v:`2`,ps:t.hostname,add:t.hostname,port:`443`,id:e,aid:`0`,net:`ws`,type:`none`,host:t.hostname,path:`/ws`,tls:`tls`,sni:t.hostname,fp:`chrome`}}function m(e,t){return{vless:f(e,t),vlessJson:p(e,t)}}var h=n(()=>{});const g={TESTING_VERSION:0,RELEASE_VERSION:1,COMMAND_TCP:1,COMMAND_UDP:2,COMMAND_MUX:3,ADDRESS_TYPE_IPV4:1,ADDRESS_TYPE_DOMAIN:2,ADDRESS_TYPE_IPV6:3,RESPONSE_DATA:e=>new Uint8Array([e,0]).buffer};var _={};r(_,{contains:()=>v,filterEmpty:()=>y,splitAndFilter:()=>b});function v(e,t){return e.includes(t)}function y(e){return e.filter(e=>e!==``)}function b(e,t){return y(e.split(t))}var x=n(()=>{});x();function S(e){let t=new Uint8Array(e),n=Array.from(t,e=>e.toString(16).padStart(2,`0`));return[n.slice(0,4).join(``),n.slice(4,6).join(``),n.slice(6,8).join(``),n.slice(8,10).join(``),n.slice(10,16).join(``)].join(`-`)}function C(e,t){if(e.byteLength<24)throw Error(`invalid protocol header`);let n=new DataView(e),r=n.getUint8(0);if(r!==g.RELEASE_VERSION&&r!==g.TESTING_VERSION)throw Error(`invalid protocol version ${r}`);let i=S(e.slice(1,17));if(!v(t,i))throw Error(`invalid user ${i}`);let a=n.getUint8(17),o=n.getUint8(18+a);if(o!==g.COMMAND_TCP&&o!==g.COMMAND_UDP)throw Error(`unsupported command ${o}`);let s=18+a+1,c=n.getUint16(s),l=n.getUint8(s+2),u=``,d,f;switch(l){case g.ADDRESS_TYPE_IPV4:d=4,f=s+3,u=new Uint8Array(e.slice(f,f+d)).join(`.`);break;case g.ADDRESS_TYPE_DOMAIN:d=n.getUint8(s+3),f=s+4,u=new TextDecoder().decode(e.slice(f,f+d));break;case g.ADDRESS_TYPE_IPV6:d=16,f=s+3,u=Array.from({length:8},(e,t)=>n.getUint16(f+t*2).toString(16)).join(`:`);break;default:throw Error(`invalid address type ${l}`)}return{version:r,isUDP:o===g.COMMAND_UDP,address:u,port:c,rawData:e.slice(f+d)}}function w(e){try{(e.readyState===WebSocket.OPEN||e.readyState===WebSocket.CLOSING)&&e.close()}catch(e){console.error(`Error closing WebSocket: ${e}`)}}async function T(e,t,n,r){for(let i of r)try{let r=await E(i,e,t,n);return r}catch(e){console.error(e);continue}}async function E(t,n,r,i){let a=null,o=null,s=null;try{let c=e(t),l=c.writable.getWriter();await l.write(r),a=async e=>{await l.write(e.data)},o=async()=>{await c.close()},s=async()=>{await c.close()},i.addEventListener(`message`,a),i.addEventListener(`close`,o),i.addEventListener(`error`,s);let u=c.readable.getReader(),{done:d,value:f}=await u.read();if(d)throw Error(`connection was done`);return u.releaseLock(),i.send(await new Blob([g.RESPONSE_DATA(n),f]).arrayBuffer()),c}catch(e){throw a&&i.removeEventListener(`message`,a),o&&i.removeEventListener(`close`,o),s&&i.removeEventListener(`error`,s),e}}async function D(e,t,n){let r;try{let n=t.address;if(isNaN(Number(n.split(`.`)[0])))try{let e=await O(n);n=e}catch(e){console.error(`Failed to resolve domain ${n}:`,e)}r=await E({hostname:n,port:t.port},t.version,t.rawData,e)}catch{r=await T(t.version,t.rawData,e,n)}if(r===void 0)throw Error(`cannot connect to hostname: ${t.address}, port: ${t.port}`);await r.readable.pipeTo(new WritableStream({write(t){e.send(t)},abort(){w(e)},close(){w(e)}}))}async function O(e){try{let t=await fetch(`https://cloudflare-dns.com/dns-query?name=${e}&type=A`,{headers:{Accept:`application/dns-json`}});if(t.ok){let e=await t.json();if(e.Answer&&e.Answer.length>0){let t=e.Answer.find(e=>e.type===1);if(t)return t.data}}}catch(e){console.error(`DNS resolution error:`,e)}return e}async function k(t,n){let r=e({hostname:`8.8.8.8`,port:53}),i=r.writable.getWriter();await i.write(n.rawData),t.addEventListener(`message`,async e=>{await i.write(e.data)}),t.addEventListener(`close`,async()=>{await r.close()}),t.addEventListener(`error`,async()=>{await r.close()});let a=r.readable.getReader(),{done:o,value:s}=await a.read();if(o)throw Error(`connection was done`);a.releaseLock(),t.send(await new Blob([g.RESPONSE_DATA(n.version),s]).arrayBuffer()),await r.readable.pipeTo(new WritableStream({write(e){t.send(e)},abort(){w(t)},close(){w(t)}}))}function A(e){e=e.replace(/-/g,`+`).replace(/_/g,`/`);let t=atob(e),n=new ArrayBuffer(t.length),r=new Uint8Array(n);for(let e=0;e<t.length;e++)r[e]=t.charCodeAt(e);return n}function j(e,t){return new Promise((n,r)=>{if(t)try{let e=A(t);n(e)}catch(e){r(e)}let i=t=>{typeof t.data==`string`?r(`invalid data`):n(t.data),e.removeEventListener(`message`,i),e.removeEventListener(`error`,a)},a=t=>{r(t.error||`WebSocket error`),e.removeEventListener(`message`,i),e.removeEventListener(`error`,a)};e.addEventListener(`message`,i),e.addEventListener(`error`,a),setTimeout(()=>{r(`timeout`),e.removeEventListener(`message`,i),e.removeEventListener(`error`,a)},1e4)})}function M(e,t){let n=t.UUID.split(`,`).filter(e=>e!==``),r=t.PROXY_IP.split(`,`).filter(e=>e!==``),[i,a]=Object.values(new WebSocketPair);if(a===void 0)throw`WebSocket server not defined`;if(i===void 0)throw`WebSocket client not defined`;return a.accept(),j(a,e.headers.get(`Sec-WebSocket-Protocol`)).then(e=>C(e,n)).then(async e=>{if(e.isUDP)if(e.port===53)await k(a,e);else throw Error(`UDP transport is unsupported`);await D(a,e,r)}).catch(e=>{console.error(e),w(a)}),new Response(null,{status:101,webSocket:i})}u(),h(),x();async function N(e,t,n){try{let n=e.headers.get(`Upgrade`);if(n&&n===`websocket`)return M(e,t);let r=new URL(e.url);if(r.pathname===`/sub`){let{subscriptionPage:n}=await Promise.resolve().then(function(){return u(),i});return await n(t,e)}let o=b(t.UUID,`,`);for(let e of o)if(r.pathname.includes(e))return new Response(f(e,r),{status:200,headers:{"Content-Type":`text/plain; charset=utf-8`}});return await a()}catch(e){return console.error(`Handler error:`,e),await o()}}var P={async fetch(e,t,n){return N(e,t,n)}};export{P as default};