// Wait for DOM to load
        document.addEventListener("DOMContentLoaded", initializeLauncher);

        function initializeLauncher() {
            // Get DOM elements
            const carouselTrack = document.getElementById("carouselTrack");
            const appBarContainer = document.getElementById("appBar");
            const prevButton = document.getElementById("prevButton");
            const nextButton = document.getElementById("nextButton");
            const helpButton = document.getElementById("helpButton");
            const toolsMenuOverlay = document.getElementById("toolsMenuOverlay");
            const closeToolsMenu = document.getElementById("closeToolsMenu");
            const blankScreenOverlay = document.getElementById("blankScreenOverlay");
            const closeBlankScreen = document.getElementById("closeBlankScreen");
            
            // Timer elements
            const timerOverlay = document.getElementById("timerOverlay");
            const closeTimer = document.getElementById("closeTimer");
            
            // Wheel elements
            const wheelOverlay = document.getElementById("wheelOverlay");
            const closeWheel = document.getElementById("closeWheel");
            
            // Calculator elements
            const calculatorOverlay = document.getElementById("calculatorOverlay");
            const closeCalculator = document.getElementById("closeCalculator");
            
            // Get all app cards
            const appCards = Array.from(carouselTrack.children);
            const totalApps = appCards.length;
            
            // Current carousel index
            let currentIndex = 0;

            // Initialize app bar
            initializeAppBar();

            // Initialize app click handlers
            initializeAppClickHandlers();

            // Initialize navigation buttons
            initializeNavigationButtons();

            // Initialize help button
            initializeHelpButton();

            // Initialize tools menu
            initializeToolsMenu();

            // Initialize blank screen functionality
            initializeBlankScreenFunctionality();
            
            // Initialize timer
            initializeTimer();
            
            // Initialize wheel
            initializeWheel();
            
            // Initialize calculator
            initializeCalculator();

            /**
             * Update carousel position and active states
             */
            function updateCarousel() {
                // Move carousel track
                const offset = -currentIndex * 100;
                carouselTrack.style.transform = `translateX(${offset}%)`;

                // Update active app bar icon
                const barIcons = appBarContainer.querySelectorAll(".app-bar-icon");
                barIcons.forEach((icon, index) => {
                    if (index === currentIndex) {
                        icon.classList.add("active");
                    } else {
                        icon.classList.remove("active");
                    }
                });
            }

            /**
             * Initialize app bar with all app icons
             */
            function initializeAppBar() {
                appCards.forEach((card, index) => {
                    const icon = card.querySelector(".app-icon");
                    const img = icon.querySelector("img");
                    const svg = icon.querySelector("svg");
                    const url = icon.getAttribute("data-url");
                    
                    // Create app bar icon
                    const barIcon = document.createElement("div");
                    barIcon.className = "app-bar-icon";
                    
                    // Set first icon as active
                    if (index === 0) {
                        barIcon.classList.add("active");
                    }
                    
                    // Clone the image or SVG
                    if (img) {
                        const barImg = document.createElement("img");
                        barImg.src = img.src;
                        barImg.alt = img.alt;
                        barIcon.appendChild(barImg);
                    } else if (svg) {
                        const barSvg = svg.cloneNode(true);
                        barSvg.style.width = "100%";
                        barSvg.style.height = "100%";
                        barIcon.appendChild(barSvg);
                    }
                    
                    // Add click handler to navigate to this app
                    barIcon.addEventListener("click", () => {
                        currentIndex = index;
                        updateCarousel();
                    });
                    
                    appBarContainer.appendChild(barIcon);
                });
            }

            /**
             * Navigate to next app
             */
            function navigateNext() {
                currentIndex = (currentIndex + 1) % totalApps;
                updateCarousel();
            }

            /**
             * Navigate to previous app
             */
            function navigatePrevious() {
                currentIndex = (currentIndex - 1 + totalApps) % totalApps;
                updateCarousel();
            }

            /**
             * Initialize navigation button handlers
             */
            function initializeNavigationButtons() {
                nextButton.addEventListener("click", navigateNext);
                prevButton.addEventListener("click", navigatePrevious);
            }

            /**
             * Initialize click handlers for app icons
             */
            function initializeAppClickHandlers() {
                const appIcons = document.querySelectorAll(".app-icon");
                
                appIcons.forEach(icon => {
                    icon.addEventListener("click", () => {
                        const url = icon.getAttribute("data-url");
                        const action = icon.getAttribute("data-action");
                        
                        if (action === "open-tools") {
                            openToolsMenu();
                        } else if (action === "blank-screen") {
                            openBlankScreen();
                        } else if (url) {
                            window.open(url, "_blank", "noopener,noreferrer");
                        }
                    });
                });
            }

            /**
             * Initialize help button handler
             */
            function initializeHelpButton() {
                helpButton.addEventListener("click", () => {
                    window.open("https://colegioatlantico.tawk.help/", "_blank", "noopener,noreferrer");
                });
            }

            /**
             * Initialize tools menu
             */
            function initializeToolsMenu() {
                // Close button handler
                closeToolsMenu.addEventListener("click", () => {
                    toolsMenuOverlay.classList.remove("active");
                });

                // Tool cards click handlers
                const toolCards = document.querySelectorAll(".tool-card");
                toolCards.forEach(card => {
                    card.addEventListener("click", () => {
                        const action = card.getAttribute("data-action");
                        
                        if (action === "blank-screen") {
                            toolsMenuOverlay.classList.remove("active");
                            openBlankScreen();
                        } else if (action === "timer") {
                            toolsMenuOverlay.classList.remove("active");
                            timerOverlay.classList.add("active");
                        } else if (action === "wheel") {
                            toolsMenuOverlay.classList.remove("active");
                            wheelOverlay.classList.add("active");
                        } else if (action === "calculator") {
                            toolsMenuOverlay.classList.remove("active");
                            openCalculatorPopup();
                        }
                    });
                });

                // Close on Escape key
                document.addEventListener("keydown", (e) => {
                    if (e.key === "Escape" && toolsMenuOverlay.classList.contains("active")) {
                        toolsMenuOverlay.classList.remove("active");
                    }
                });
            }

            /**
             * Open tools menu
             */
            function openToolsMenu() {
                toolsMenuOverlay.classList.add("active");
            }

            /**
             * Initialize blank screen functionality
             */
            function initializeBlankScreenFunctionality() {
                // Close blank screen and exit fullscreen
                closeBlankScreen.addEventListener("click", () => {
                    closeBlankScreenFunction();
                });

                // Also close when pressing Escape key
                document.addEventListener("keydown", (e) => {
                    if (e.key === "Escape" && blankScreenOverlay.classList.contains("active")) {
                        closeBlankScreenFunction();
                    }
                });
            }

            /**
             * Open blank screen in fullscreen mode
             */
            function openBlankScreen() {
                blankScreenOverlay.classList.add("active");
                
                // Request fullscreen
                if (blankScreenOverlay.requestFullscreen) {
                    blankScreenOverlay.requestFullscreen();
                } else if (blankScreenOverlay.webkitRequestFullscreen) {
                    blankScreenOverlay.webkitRequestFullscreen();
                } else if (blankScreenOverlay.msRequestFullscreen) {
                    blankScreenOverlay.msRequestFullscreen();
                }
            }

            /**
             * Close blank screen and exit fullscreen
             */
            function closeBlankScreenFunction() {
                blankScreenOverlay.classList.remove("active");
                
                // Exit fullscreen
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
            }

            /**
             * Initialize Timer functionality
             */
            function initializeTimer() {
                let timerInterval = null;
                let timeLeft = 0;
                let isPaused = false;

                const timerDisplay = document.getElementById("timerDisplay");
                const timerMinutes = document.getElementById("timerMinutes");
                const timerSeconds = document.getElementById("timerSeconds");
                const startButton = document.getElementById("startTimer");
                const pauseButton = document.getElementById("pauseTimer");
                const resetButton = document.getElementById("resetTimer");

                function updateDisplay() {
                    const mins = Math.floor(timeLeft / 60);
                    const secs = timeLeft % 60;
                    timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                }

                function startTimer() {
                    if (!isPaused) {
                        const minutes = parseInt(timerMinutes.value) || 0;
                        const seconds = parseInt(timerSeconds.value) || 0;
                        timeLeft = minutes * 60 + seconds;
                    }
                    
                    if (timeLeft <= 0) return;
                    
                    isPaused = false;
                    clearInterval(timerInterval);
                    updateDisplay();
                    
                    timerInterval = setInterval(() => {
                        timeLeft--;
                        updateDisplay();
                        
                        if (timeLeft <= 0) {
                            clearInterval(timerInterval);
                            timerInterval = null;
                            playTimerSound();
                        }
                    }, 1000);
                }

                function pauseTimer() {
                    isPaused = true;
                    clearInterval(timerInterval);
                    timerInterval = null;
                }

                function resetTimer() {
                    clearInterval(timerInterval);
                    timerInterval = null;
                    isPaused = false;
                    timeLeft = 0;
                    timerDisplay.textContent = "00:00";
                }

                function playTimerSound() {
                    try {
                        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                        const oscillator = audioContext.createOscillator();
                        const gainNode = audioContext.createGain();
                        
                        oscillator.connect(gainNode);
                        gainNode.connect(audioContext.destination);
                        
                        oscillator.frequency.value = 800;
                        oscillator.type = 'sine';
                        
                        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                        
                        oscillator.start(audioContext.currentTime);
                        oscillator.stop(audioContext.currentTime + 0.5);
                    } catch (error) {
                        console.log("Audio not available");
                    }
                }

                startButton.addEventListener("click", startTimer);
                pauseButton.addEventListener("click", pauseTimer);
                resetButton.addEventListener("click", resetTimer);

                closeTimer.addEventListener("click", () => {
                    timerOverlay.classList.remove("active");
                    resetTimer();
                });

                document.addEventListener("keydown", (e) => {
                    if (e.key === "Escape" && timerOverlay.classList.contains("active")) {
                        timerOverlay.classList.remove("active");
                        resetTimer();
                    }
                });
            }

            /**
             * Initialize Wheel functionality
             */
            function initializeWheel() {
                closeWheel.addEventListener("click", () => {
                    wheelOverlay.classList.remove("active");
                });

                document.addEventListener("keydown", (e) => {
                    if (e.key === "Escape" && wheelOverlay.classList.contains("active")) {
                        wheelOverlay.classList.remove("active");
                    }
                });
            }

            /**
             * Initialize Calculator functionality
             */
            function initializeCalculator() {
                // Calculator now opens in a popup window, no initialization needed
            }

            /**
             * Open calculator in a popup window
             */
            function openCalculatorPopup() {
                const width = 900;
                const height = 700;
                const left = (screen.width - width) / 2;
                const top = (screen.height - height) / 2;
                
                window.open(
                    'https://www.desmos.com/scientific',
                    'CalculatorPopup',
                    `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,status=no,menubar=no,toolbar=no,location=no`
                );
            }
        }