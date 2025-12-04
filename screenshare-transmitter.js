// Screenshare Transmitter Logic (Device)
let peer = null;
let localStream = null;
let activeCall = null;
let boardCode = null;

// Code input handling
const digits = document.querySelectorAll('.code-digit');
digits.forEach((digit, index) => {
    digit.addEventListener('input', (e) => {
        const value = e.target.value;
        
        // Only allow numbers
        if (!/^\d*$/.test(value)) {
            e.target.value = '';
            return;
        }

        // Move to next input
        if (value.length === 1 && index < digits.length - 1) {
            digits[index + 1].focus();
        }
    });

    digit.addEventListener('keydown', (e) => {
        // Move to previous input on backspace
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
            digits[index - 1].focus();
        }
    });

    digit.addEventListener('paste', (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text');
        const numbers = pastedData.match(/\d/g);
        
        if (numbers) {
            numbers.forEach((num, i) => {
                if (index + i < digits.length) {
                    digits[index + i].value = num;
                }
            });
            
            // Focus last filled digit or next empty
            const lastIndex = Math.min(index + numbers.length - 1, digits.length - 1);
            digits[lastIndex].focus();
        }
    });
});

// Check for code in URL (if coming from QR code or link)
const urlParams = new URLSearchParams(window.location.search);
const codeFromUrl = urlParams.get('code');

if (codeFromUrl && codeFromUrl.length === 6) {
    // Pre-fill the code from URL
    Array.from(codeFromUrl).forEach((digit, index) => {
        if (digits[index]) {
            digits[index].value = digit;
        }
    });
}

// Focus first input on load
digits[0].focus();

// Connect button handler
document.getElementById('connectButton').addEventListener('click', () => {
    const code = Array.from(digits).map(d => d.value).join('');
    
    if (code.length !== 6) {
        showStatus('Por favor, insere um código de 6 dígitos', 'error');
        return;
    }

    boardCode = code;
    startScreenShareAndConnect();
});

// Stop button handler
document.getElementById('stopButton').addEventListener('click', () => {
    stopScreenShare();
});

// Initialize PeerJS
function initializePeer() {
    if (peer) return;
    
    peer = new Peer({
        config: {
            'iceServers': [
                // Google STUN servers (just 2 is enough)
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                // TURN servers for fallback
                { 
                    urls: 'turn:numb.viagenie.ca',
                    username: 'webrtc@live.com',
                    credential: 'muazkh'
                },
                {
                    urls: 'turn:relay1.expressturn.com:3478',
                    username: 'efE4K6Z42FZAZQPBHC',
                    credential: 'Uc4ZYhKguShSD3SU'
                }
            ],
            'iceTransportPolicy': 'all',
            'iceCandidatePoolSize': 10
        }
    });

    peer.on('open', (id) => {
        console.log('Transmitter Peer ID:', id);
    });

    peer.on('error', (err) => {
        console.error('Peer error:', err);
        let errorMessage = 'Erro de ligação';
        
        // Don't show error for peer-unavailable during connection attempts
        // Let the retry logic handle it
        if (err.type === 'peer-unavailable') {
            console.log('Peer unavailable, will retry via call error handler');
            return;
        }
        
        if (err.type === 'network') {
            errorMessage = 'Erro de rede. Verifica a tua ligação.';
        } else if (err.type === 'server-error') {
            errorMessage = 'Erro no servidor. Tenta novamente.';
        }
        
        showStatus(errorMessage, 'error');
        resetToInput();
    });

    peer.on('disconnected', () => {
        showStatus('Desligado. A tentar reconectar...', 'warning');
        peer.reconnect();
    });
}

// Start screen sharing and connect to board
async function startScreenShareAndConnect() {
    try {
        showStatus('A pedir permissão para partilhar ecrã...', 'warning');
        
        // Request screen capture with more flexible constraints
        localStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                cursor: 'always',
                frameRate: { ideal: 30, max: 60 },
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: false
        });

        // Verify we got a valid video track
        const videoTracks = localStream.getVideoTracks();
        if (videoTracks.length === 0) {
            throw new Error('No video track in captured stream');
        }
        
        const videoTrack = videoTracks[0];
        const settings = videoTrack.getSettings();
        console.log('Screen capture started:', settings);
        console.log('Video track state:', {
            enabled: videoTrack.enabled,
            muted: videoTrack.muted,
            readyState: videoTrack.readyState,
            label: videoTrack.label
        });
        
        // Make sure track is enabled and not muted
        if (videoTrack.muted) {
            console.warn('Video track is muted!');
        }
        if (!videoTrack.enabled) {
            console.warn('Video track is disabled, enabling...');
            videoTrack.enabled = true;
        }
        
        showStatus('A ligar ao quadro...', 'warning');
        
        // Initialize peer if not already
        initializePeer();

        // Wait for peer to be ready, then call the board
        if (peer && peer.id) {
            makeCallToBoard();
        } else {
            peer.on('open', () => {
                makeCallToBoard();
            });
        }

        // Update UI
        document.getElementById('codeInputSection').style.display = 'none';
        document.getElementById('sharingSection').style.display = 'flex';

        // Handle stream end (user stops sharing via browser)
        localStream.getVideoTracks()[0].addEventListener('ended', () => {
            stopScreenShare();
        });

    } catch (err) {
        console.error('Error starting screen share:', err);
        
        let errorMessage = 'Erro ao partilhar ecrã';
        if (err.name === 'NotAllowedError') {
            errorMessage = 'Permissão negada. No macOS, vai a Definições do Sistema > Privacidade e Segurança > Gravação de Ecrã e autoriza o teu navegador.';
        } else if (err.name === 'NotFoundError') {
            errorMessage = 'Nenhum ecrã disponível para partilhar.';
        } else if (err.name === 'NotSupportedError') {
            errorMessage = 'Partilha de ecrã não suportada neste navegador.';
        } else if (err.name === 'NotReadableError') {
            errorMessage = 'Não foi possível aceder ao ecrã. No macOS, verifica as permissões de Gravação de Ecrã.';
        }
        
        showStatus(errorMessage, 'error');
        resetToInput();
    }
}

// Make the call to the board
function makeCallToBoard() {
    if (!peer || !boardCode || !localStream) {
        showStatus('Erro ao estabelecer ligação', 'error');
        return;
    }

    console.log('Calling board with code:', boardCode);
    showStatus('A conectar ao quadro...', 'warning');
    
    // Add a small delay to ensure board peer is ready
    setTimeout(() => {
        attemptConnection(0);
    }, 500);
}

function attemptConnection(retryCount) {
    const maxRetries = 5;
    
    if (retryCount >= maxRetries) {
        showStatus('Não foi possível ligar. Verifica se o código está correto e se o quadro está ligado.', 'error');
        resetToInput();
        return;
    }
    
    console.log(`Attempt ${retryCount + 1} to connect to board ${boardCode}`);
    showStatus('A conectar... (' + (retryCount + 1) + '/' + maxRetries + ')', 'warning');
    
    // Try to call the board's peer ID with our screen stream
    try {
        activeCall = peer.call(boardCode, localStream);
    } catch (err) {
        console.error('Error creating call:', err);
        setTimeout(() => attemptConnection(retryCount + 1), 2000);
        return;
    }

    if (!activeCall) {
        console.log('Call object is null, retrying...');
        setTimeout(() => attemptConnection(retryCount + 1), 2000);
        return;
    }

    console.log('Call created, waiting for connection...');
    
    // Set a timeout for the connection
    let connectionTimeout = setTimeout(() => {
        if (activeCall && !activeCall.open) {
            console.log('Connection timeout, retrying...');
            if (activeCall) {
                activeCall.close();
                activeCall = null;
            }
            setTimeout(() => attemptConnection(retryCount + 1), 2000);
        }
    }, 5000);

    activeCall.on('stream', (remoteStream) => {
        // Board doesn't send stream back, so this won't be called normally
        console.log('Received stream from board (unexpected)');
    });

    // Check if call was answered (connection established)
    const checkConnection = setInterval(() => {
        if (activeCall && activeCall.open) {
            clearInterval(checkConnection);
            clearTimeout(connectionTimeout);
            showStatus('Ligado! A partilhar ecrã...', 'success');
            console.log('Successfully connected to board');
        }
    }, 100);

    activeCall.on('close', () => {
        clearInterval(checkConnection);
        clearTimeout(connectionTimeout);
        console.log('Call closed');
        showStatus('Ligação terminada', 'warning');
        stopScreenShare();
    });

    activeCall.on('error', (err) => {
        clearInterval(checkConnection);
        clearTimeout(connectionTimeout);
        console.error('Call error:', err);
        
        if (activeCall) {
            activeCall.close();
            activeCall = null;
        }
        
        // Retry on error
        if (retryCount < maxRetries - 1) {
            console.log('Retrying after error...');
            setTimeout(() => attemptConnection(retryCount + 1), 2000);
        } else {
            showStatus('Não foi possível ligar. Código inválido ou quadro offline.', 'error');
            resetToInput();
        }
    });
}

// Stop screen sharing
function stopScreenShare() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }

    if (activeCall) {
        activeCall.close();
        activeCall = null;
    }

    resetToInput();
}

function resetToInput() {
    document.getElementById('codeInputSection').style.display = 'flex';
    document.getElementById('sharingSection').style.display = 'none';
    
    // Clear inputs if not from URL
    if (!urlParams.get('code')) {
        digits.forEach(digit => digit.value = '');
        digits[0].focus();
    }
    
    showStatus('', '');
}

// Show status message
function showStatus(message, type) {
    const statusElement = document.getElementById('statusMessage');
    statusElement.textContent = message;
    
    // Reset styles
    statusElement.style.color = '#9bb3d6';
    statusElement.style.background = 'transparent';
    statusElement.style.border = 'none';
    
    // Apply type-specific styling
    if (type === 'error') {
        statusElement.style.color = '#ff6b6b';
        statusElement.style.background = 'rgba(255, 107, 107, 0.1)';
        statusElement.style.border = '1px solid rgba(255, 107, 107, 0.3)';
    } else if (type === 'success') {
        statusElement.style.color = '#51cf66';
        statusElement.style.background = 'rgba(81, 207, 102, 0.1)';
        statusElement.style.border = '1px solid rgba(81, 207, 102, 0.3)';
    } else if (type === 'warning') {
        statusElement.style.color = '#ffd43b';
        statusElement.style.background = 'rgba(255, 212, 59, 0.1)';
        statusElement.style.border = '1px solid rgba(255, 212, 59, 0.3)';
    }
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    stopScreenShare();
    if (peer) {
        peer.destroy();
    }
});
