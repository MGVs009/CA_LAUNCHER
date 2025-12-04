// Screenshare Receiver Logic (Board)
let peer = null;
let myPeerId = null;
let activeCall = null;

// Generate 6-digit code
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Initialize the receiver (board)
function initializeReceiver() {
    const code = generateCode();
    myPeerId = code;
    
    // Display code
    document.getElementById('codeDisplay').textContent = code;
    
    // Generate and display link
    const currentUrl = window.location.href;
    const baseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/'));
    const shareLink = `${baseUrl}/screenshare-transmitter.html?code=${code}`;
    document.getElementById('linkDisplay').textContent = shareLink;
    
    // Generate QR code
    const qrContainer = document.getElementById('qrcode');
    qrContainer.innerHTML = '';
    
    try {
        new QRCode(qrContainer, {
            text: shareLink,
            width: 200,
            height: 200,
            colorDark: '#0c1c3c',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
        console.log('QR code generated successfully');
    } catch (error) {
        console.error('QR Code error:', error);
        showStatus('Erro ao gerar código QR', 'error');
    }
    
    // Initialize PeerJS with the code as the peer ID
    initializePeer(code);
}

// Initialize PeerJS
function initializePeer(peerId) {
    showStatus('A preparar...', 'warning');
    
    peer = new Peer(peerId, {
        config: {
            'iceServers': [
                // Google STUN servers
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' },
                // Twilio STUN
                { urls: 'stun:global.stun.twilio.com:3478' },
                // Free TURN servers - multiple options for redundancy
                { 
                    urls: 'turn:numb.viagenie.ca',
                    username: 'webrtc@live.com',
                    credential: 'muazkh'
                },
                { 
                    urls: 'turn:openrelay.metered.ca:80',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                },
                {
                    urls: 'turn:openrelay.metered.ca:443',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                },
                {
                    urls: 'turn:relay1.expressturn.com:3478',
                    username: 'efE4K6Z42FZAZQPBHC',
                    credential: 'Uc4ZYhKguShSD3SU'
                }
            ],
            'iceTransportPolicy': 'all',
            'iceCandidatePoolSize': 10
        },
        debug: 2 // Enable debug logging
    });

    peer.on('open', (id) => {
        console.log('Receiver Peer ID registered:', id);
        showStatus('Pronto! A aguardar partilha...', 'success');
    });

    peer.on('call', (call) => {
        console.log('Incoming call received from peer:', call.peer);
        showStatus('A ligar...', 'warning');
        
        // Answer the call (we don't send any stream, just receive)
        call.answer();
        activeCall = call;
        
        console.log('Call answered, waiting for stream...');

        call.on('stream', (remoteStream) => {
            console.log('Remote stream received!');
            console.log('Stream details:', {
                id: remoteStream.id,
                active: remoteStream.active,
                videoTracks: remoteStream.getVideoTracks().length,
                audioTracks: remoteStream.getAudioTracks().length
            });
            
            if (remoteStream.getVideoTracks().length > 0) {
                const videoTrack = remoteStream.getVideoTracks()[0];
                console.log('Video track settings:', videoTrack.getSettings());
                console.log('Video track enabled:', videoTrack.enabled);
                console.log('Video track muted:', videoTrack.muted);
                console.log('Video track readyState:', videoTrack.readyState);
            }
            
            showStatus('Ligado!', 'success');
            
            // Display the remote video
            const videoElement = document.getElementById('remoteVideo');
            videoElement.srcObject = remoteStream;
            
            // Force video to play
            videoElement.play().catch(err => {
                console.error('Error playing video:', err);
            });
            
            // Log video element state after setting stream
            videoElement.addEventListener('loadedmetadata', () => {
                console.log('Video metadata loaded:', {
                    videoWidth: videoElement.videoWidth,
                    videoHeight: videoElement.videoHeight,
                    duration: videoElement.duration,
                    paused: videoElement.paused
                });
            });
            
            // Show video container, hide waiting
            document.getElementById('waitingContainer').style.display = 'none';
            document.getElementById('videoContainer').style.display = 'flex';
            
            // Request fullscreen
            requestFullscreen();
        });

        call.on('close', () => {
            console.log('Call closed');
            showStatus('Partilha terminada', 'warning');
            resetToWaiting();
        });

        call.on('error', (err) => {
            console.error('Call error:', err);
            showStatus('Occoreu um erro na partilha: ' + err.message, 'error');
        });
    });

    peer.on('error', (err) => {
        console.error('Peer error:', err);
        let errorMessage = 'Erro de ligação';
        
        if (err.type === 'unavailable-id') {
            errorMessage = 'Este código já está em uso. A gerar novo código...';
            setTimeout(() => {
                location.reload();
            }, 2000);
        } else if (err.type === 'network') {
            errorMessage = 'Erro de ligação. Confirma que estás ligado a internet.';
        } else if (err.type === 'server-error') {
            errorMessage = 'Erro no servidor. Tenta novamente.';
        }
        
        showStatus(errorMessage, 'error');
    });

    peer.on('disconnected', () => {
        console.log('Peer disconnected, attempting to reconnect...');
        showStatus('Desligado. A tentar reconectar...', 'warning');
        peer.reconnect();
    });
    
    peer.on('connection', (conn) => {
        console.log('Data connection received from:', conn.peer);
    });
}

// Disconnect handler
document.getElementById('disconnectButton').addEventListener('click', () => {
    disconnect();
});

function disconnect() {
    if (activeCall) {
        activeCall.close();
        activeCall = null;
    }
    resetToWaiting();
}

function resetToWaiting() {
    document.getElementById('videoContainer').style.display = 'none';
    document.getElementById('waitingContainer').style.display = 'flex';
    
    const videoElement = document.getElementById('remoteVideo');
    if (videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
    }
    
    // Exit fullscreen if active
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.log('Error exiting fullscreen:', err));
    }
    
    // Show beta banner again
    const betaBanner = document.getElementById('betaBanner');
    if (betaBanner) {
        betaBanner.style.display = 'flex';
    }
    
    showStatus('A aguardar partilha...', 'success');
}

function requestFullscreen() {
    const elem = document.documentElement;
    const betaBanner = document.getElementById('betaBanner');
    
    try {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) { // Safari
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { // IE11
            elem.msRequestFullscreen();
        }
        console.log('Fullscreen requested');
        
        // Hide beta banner in fullscreen
        if (betaBanner) {
            betaBanner.style.display = 'none';
        }
    } catch (err) {
        console.error('Error requesting fullscreen:', err);
    }
}

function showStatus(message, type) {
    const statusElement = document.getElementById('statusMessage');
    statusElement.textContent = message;
    
    // Reset colors
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

// Initialize on load
initializeReceiver();

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (activeCall) {
        activeCall.close();
    }
    if (peer) {
        peer.destroy();
    }
});
