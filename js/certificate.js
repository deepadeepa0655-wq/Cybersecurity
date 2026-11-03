// Certificate Generator for Cyber Shield
const CertificateEngine = (function() {
  function generate(canvasEl, user) {
    if (!canvasEl) return;
    const ctx = canvasEl.getContext("2d");
    const width = 1200;
    const height = 800;
    canvasEl.width = width;
    canvasEl.height = height;

    // Background gradient
    const bgGrad = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, 600);
    bgGrad.addColorStop(0, "#121a30");
    bgGrad.addColorStop(1, "#0a0e1a");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle Cyber Grid on Canvas
    ctx.strokeStyle = "rgba(0, 229, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Outer Decorative Neon Cyan Border
    ctx.strokeStyle = "#00e5ff";
    ctx.lineWidth = 6;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00e5ff";
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // Inner Neon Magenta Border
    ctx.strokeStyle = "#b026ff";
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#b026ff";
    ctx.strokeRect(42, 42, width - 84, height - 84);
    ctx.shadowBlur = 0;

    const branding = (window.FirebaseBridge && FirebaseBridge.getBrandingConfig)
      ? FirebaseBridge.getBrandingConfig()
      : { appName: "CYBERQUEST", certificateOrgName: "CYBERQUEST SAFETY QUEST", certificateSubtitle: "ONLINE SAFETY GAME AWARD", logoIcon: "🛡️" };

    // Corner Ornaments
    drawCorner(ctx, 42, 42);
    drawCorner(ctx, width - 42, 42, 90);
    drawCorner(ctx, width - 42, height - 42, 180);
    drawCorner(ctx, 42, height - 42, 270);

    // Shield Emblem Logo
    ctx.font = "60px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(branding.logoIcon || "🛡️", width / 2, 130);

    // Title
    ctx.fillStyle = "#00e5ff";
    ctx.font = "bold 34px 'Orbitron', sans-serif";
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#00e5ff";
    ctx.fillText((branding.certificateOrgName || "CYBERQUEST SAFETY QUEST").toUpperCase(), width / 2, 180);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#a0b3cf";
    ctx.font = "16px 'Share Tech Mono', monospace";
    ctx.fillText(branding.certificateSubtitle || "OFFICIAL CERTIFICATE OF CYBERSECURITY PROFICIENCY", width / 2, 215);

    // Decorative line
    ctx.strokeStyle = "#b026ff";
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#b026ff";
    ctx.beginPath();
    ctx.moveTo(350, 235);
    ctx.lineTo(850, 235);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Body
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "18px 'Inter', sans-serif";
    ctx.fillText("THIS CERTIFIES THAT CYBER AGENT", width / 2, 290);

    // Agent Name
    ctx.fillStyle = "#00e5ff";
    ctx.font = "bold 44px 'Orbitron', sans-serif";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00e5ff";
    ctx.fillText((user?.agentName || "AGENT").toUpperCase(), width / 2, 360);
    ctx.shadowBlur = 0;

    // Details text
    ctx.fillStyle = "#a0b3cf";
    ctx.font = "18px 'Inter', sans-serif";
    ctx.fillText("has successfully cleared comprehensive practical simulations in", width / 2, 420);
    ctx.fillStyle = "#39ff14";
    ctx.font = "bold 20px 'Orbitron', sans-serif";
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#39ff14";
    ctx.fillText("PASSWORDS · PHISHING · MALWARE · 2FA · SOCIAL ENGINEERING", width / 2, 460);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#a0b3cf";
    ctx.font = "16px 'Share Tech Mono', monospace";
    ctx.fillText(`CLEARANCE TIER: ${user?.rankTitle || 'Field Agent'} | TOTAL SCORE: ${user?.score || 0} PTS`, width / 2, 510);

    // Verification Hash & Seal
    const certId = "CS-" + Math.abs(hashCode(user?.agentName || "CYBER")).toString(16).toUpperCase().padStart(8, '0');
    const issueDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    ctx.fillStyle = "#6b82a3";
    ctx.font = "14px 'Share Tech Mono', monospace";
    ctx.fillText(`VERIFICATION HASH: ${certId} | ISSUED: ${issueDate}`, width / 2, 560);

    // Signatures
    ctx.strokeStyle = "#273956";
    ctx.beginPath();
    ctx.moveTo(180, 680);
    ctx.lineTo(440, 680);
    ctx.moveTo(760, 680);
    ctx.lineTo(1020, 680);
    ctx.stroke();

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "italic 22px 'Orbitron', sans-serif";
    ctx.fillText("ViperZero", 310, 665);
    ctx.fillText("Director S. Vance", 890, 665);

    ctx.fillStyle = "#6b82a3";
    ctx.font = "12px 'Share Tech Mono', monospace";
    ctx.fillText("CYBER COMMAND LEAD", 310, 705);
    ctx.fillText("DIRECTOR OF OPERATIONS", 890, 705);

    // Safe Green Neon Seal
    ctx.fillStyle = "#39ff14";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#39ff14";
    ctx.beginPath();
    ctx.arc(width / 2, 670, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#0a0e1a";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText("★", width / 2, 678);
  }

  function drawCorner(ctx, x, y, angle = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.strokeStyle = "#00e5ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(30, 0);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 30);
    ctx.stroke();
    ctx.restore();
  }

  function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  function download(canvasEl, filename = "CyberShield_Certificate.png") {
    if (!canvasEl) return;
    const a = document.createElement("a");
    a.download = filename;
    a.href = canvasEl.toDataURL("image/png");
    a.click();
  }

  return { generate, download };
})();
