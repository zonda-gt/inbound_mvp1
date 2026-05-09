'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { track } from '@/lib/analytics';
import { getAnonymousUserId, getDeviceType } from '@/lib/tracking';
import './scan.css';

/* ── Simple markdown renderer ── */
function renderResponse(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((p, j) => {
      if (p.startsWith('**') && p.endsWith('**'))
        return <strong key={j}>{p.slice(2, -2)}</strong>;
      return <span key={j}>{p}</span>;
    });
    if (line.match(/^\s*[-•]\s/)) {
      return (
        <div key={i} className="bullet">
          <span className="bullet-dot">•</span>
          <span>{rendered}</span>
        </div>
      );
    }
    if (line.match(/^\d+\.\s/))
      return <div key={i} style={{ marginBottom: 4 }}>{rendered}</div>;
    if (!line.trim()) return <div key={i} style={{ height: 8 }} />;
    return <div key={i} style={{ marginBottom: 2 }}>{rendered}</div>;
  });
}

export default function ScanLanding() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [hasScanned, setHasScanned] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Track page view
  useEffect(() => {
    track('scan_landing_view' as never, {} as never);
  }, []);

  // Auto-start camera on mount
  useEffect(() => {
    if (!capturedImage) startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capturedImage]);

  const startCamera = useCallback(async () => {
    setCameraError('');
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch {
      setCameraError('Camera access needed to scan. Tap below to upload a photo instead.');
      setCameraReady(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
  }, []);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !cameraReady) return;

    const canvas = document.createElement('canvas');
    const MAX = 1000;
    let w = video.videoWidth;
    let h = video.videoHeight;
    if (w > MAX || h > MAX) {
      if (w > h) { h = Math.round(h * (MAX / w)); w = MAX; }
      else { w = Math.round(w * (MAX / h)); h = MAX; }
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const base64 = dataUrl.split(',')[1];
    setCapturedImage(base64);
    setImagePreview(dataUrl);
    stopCamera();
    track('scan_landing_capture' as never, { method: 'capture' } as never);
  }, [cameraReady, stopCamera]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Please select an image.'); return; }
    setError('');
    setResponse('');
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      const base64: string = await new Promise((resolve, reject) => {
        img.onload = () => {
          URL.revokeObjectURL(url);
          const MAX = 1000;
          let w = img.width;
          let h = img.height;
          if (w > MAX || h > MAX) {
            if (w > h) { h = Math.round(h * (MAX / w)); w = MAX; }
            else { w = Math.round(w * (MAX / h)); h = MAX; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) { reject(new Error('Canvas not supported')); return; }
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl.split(',')[1]);
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load')); };
        img.src = url;
      });
      setCapturedImage(base64);
      setImagePreview(`data:image/jpeg;base64,${base64}`);
      stopCamera();
      track('scan_landing_capture' as never, { method: 'upload' } as never);
    } catch {
      setError('Failed to process image.');
    }
  }, [stopCamera]);

  const handleScan = useCallback(async () => {
    if (!capturedImage) return;
    setLoading(true);
    setResponse('');
    setError('');
    setHasScanned(true);
    let receivedText = false;
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: capturedImage,
          mode: 'IDENTIFY',
          anonymousUserId: getAnonymousUserId(),
          deviceType: getDeviceType(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Scan failed');
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream');
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) { setError(parsed.error); break; }
              if (parsed.text) {
                receivedText = true;
                setResponse((prev) => prev + parsed.text);
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
      track('scan_landing_complete' as never, { has_response: receivedText } as never);
    }
  }, [capturedImage]);

  // Auto-scan after capture
  useEffect(() => {
    if (capturedImage && !loading && !response && !error) handleScan();
  }, [capturedImage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReset = useCallback(() => {
    setCapturedImage(null);
    setImagePreview(null);
    setResponse('');
    setError('');
  }, []);

  // Scroll to result when it appears
  useEffect(() => {
    if ((response || loading) && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [response, loading]);

  const showResult = response.length > 0 || loading;

  return (
    <div className="scan-page">
      {/* Background effects */}
      <div className="scan-bg-mesh" />
      <div className="scan-lines-overlay" />

      <div className="scan-content">
        {/* ═══ Hero ═══ */}
        <div className="scan-hero">
          <motion.div
            className="scan-logo"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            HELLOCHINAPAL
          </motion.div>

          <motion.h1
            className="scan-headline"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <span className="scan-headline-gradient">
              {hasScanned ? 'AI Says...' : 'Scan Anything.'}
            </span>
          </motion.h1>

          <motion.p
            className="scan-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {hasScanned
              ? 'Here\u2019s what we found'
              : 'Point your camera at anything around you. Menus, signs, food — AI explains it all instantly.'}
          </motion.p>

          {/* ═══ Camera viewfinder ═══ */}
          <AnimatePresence mode="wait">
            {!showResult ? (
              <motion.div
                key="camera"
                className="scan-viewfinder"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                {/* Live video feed */}
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  style={{ display: capturedImage ? 'none' : 'block' }}
                />

                {/* Captured image freeze */}
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Captured"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}

                {/* Camera error / placeholder */}
                {cameraError && !capturedImage && (
                  <div className="scan-camera-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span>{cameraError}</span>
                  </div>
                )}

                {/* Corner brackets */}
                <div className="scan-corner scan-corner--tl" />
                <div className="scan-corner scan-corner--tr" />
                <div className="scan-corner scan-corner--bl" />
                <div className="scan-corner scan-corner--br" />

                {/* Animated scan line */}
                {!capturedImage && cameraReady && <div className="scan-laser" />}
              </motion.div>
            ) : (
              /* ═══ Result card ═══ */
              <motion.div
                key="result"
                ref={resultRef}
                className="scan-result-section"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="scan-result-card">
                  {imagePreview && (
                    <img src={imagePreview} alt="" className="scan-result-image" />
                  )}
                  <div className="scan-result-body">
                    <div className="scan-result-badge">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
                      </svg>
                      AI SCAN
                    </div>
                    <div className="scan-result-text">
                      {response ? (
                        renderResponse(response)
                      ) : (
                        <div className="scan-skeleton">
                          <div className="scan-skeleton-line" style={{ width: '85%' }} />
                          <div className="scan-skeleton-line" style={{ width: '60%' }} />
                          <div className="scan-skeleton-line" style={{ width: '72%' }} />
                          <div className="scan-skeleton-line" style={{ width: '45%' }} />
                        </div>
                      )}
                    </div>
                    {error && <div className="scan-error">{error}</div>}
                    {loading && (
                      <div className="scan-analyzing">
                        <div className="scan-analyzing-dot" />
                        <span>Analyzing...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ═══ ChinaPal Pitch ═══ */}
                {!loading && response && (
                  <motion.div
                    className="scan-pitch"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="scan-pitch-title">
                      This is just the beginning.
                    </div>
                    <div className="scan-pitch-desc">
                      HelloChina is your AI-powered companion for navigating China.
                      Scan menus, find restaurants, get directions, and chat with AI
                      that actually knows China.
                    </div>
                    <div className="scan-pitch-features">
                      <span className="scan-pitch-chip">AI Menu Scanner</span>
                      <span className="scan-pitch-chip">Restaurant Finder</span>
                      <span className="scan-pitch-chip">Metro Navigation</span>
                      <span className="scan-pitch-chip">AI Travel Chat</span>
                    </div>
                    <a href="/v2" className="scan-cta-btn">
                      Explore HelloChina
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </a>
                    <span className="scan-cta-secondary">Free. No download. Works in your browser.</span>
                  </motion.div>
                )}

                {/* Retake button */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
                  <button className="scan-retake-btn" onClick={handleReset}>
                    Scan Something Else
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ Capture controls (pre-scan) ═══ */}
          {!showResult && !capturedImage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <button className="scan-capture-btn" onClick={handleCapture} aria-label="Capture">
                <span className="scan-capture-glow" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/heic,image/webp"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = '';
                }}
                style={{ display: 'none' }}
              />
              <button className="scan-upload-btn" onClick={() => fileInputRef.current?.click()}>
                or upload a photo
              </button>

              <div className="scan-features-strip">
                <span className="scan-feature-tag">Menus</span>
                <span className="scan-feature-tag">Signs</span>
                <span className="scan-feature-tag">Food</span>
                <span className="scan-feature-tag">Products</span>
                <span className="scan-feature-tag">Anything</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
