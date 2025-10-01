(async() => {
    const { PublicKey, Connection, Transaction, SystemProgram, TransactionInstruction } = solanaWeb3;

    const MOVES = {
        0: "Rock",
        1: "Paper",
        2: "Scissors"
    }
    
    // Atualize este Program ID com o ID do seu contrato após o deploy
    const PROGRAM_ID = new PublicKey("Fg1PynP5JPrFhvfQ18RmPkfGM4YHTGpmV5pW547uR2Bq");
    
    // Conta de tesouraria - substitua pela chave pública da conta de tesouraria criada
    const TREASURY_PUBKEY = new PublicKey("xuSBAdPizFNZFmBL9j8qe2RrZXK6XLF1kugz2ziwU3E");
    
    const NETWORK = "https://api.devnet.solana.com";
    const connection = new Connection(NETWORK, "confirmed");

    const connectBtn = document.getElementById("connectBtn");

    document.querySelectorAll(".connectBtn").forEach(btn => {
        btn.onclick = connectBtn.onclick;
    });

    const walletInfo = document.getElementById("walletInfo");
    const walletBalance = document.getElementById("walletBalance");
    const gameDiv = document.getElementById("game");
    const moveSelect = document.getElementById("moveSelect");
    const playBtn = document.getElementById("playBtn");
    const resultDiv = document.getElementById("result");
    const scoreDiv = document.getElementById("score");
    const SRC = document.getElementById("SRC");
    const historyListDiv = document.getElementById("historyList"); 
    const firebaseSection = document.getElementById("firebaseSection");
    const nicknameInput = document.getElementById("nicknameInput");
    const registerFirebaseBtn = document.getElementById("registerFirebaseBtn");
    const firebaseStatus = document.getElementById("firebaseStatus");

    const rankingTable = document.getElementById("rankingTable");
    const rankingBody = document.getElementById("rankingBody");
    const rankingStatus = document.getElementById("rankingStatus");
    const refreshRankingBtn = document.getElementById("refreshRankingBtn");

    // Novos elementos para o sistema de pagamento
    const playsLeftDiv = document.getElementById("playsLeft");
    const payForPlaysBtn = document.getElementById("payForPlaysBtn");
    const paymentStatus = document.getElementById("paymentStatus");

    let provider = null;
    let publicKey = null;
    let gameStatePDA = null;

    //==========================================================================// 

    function getPDA(userPubkey) {
        return PublicKey.findProgramAddress(
            [Buffer.from("game_state"), userPubkey.toBuffer()],
            PROGRAM_ID
        );
    }

    //==========================================================================// 

    async function initializeGameState() {
        if (!publicKey) return;

        try {
            const [pda] = await getPDA(publicKey);
            gameStatePDA = pda;

            // Verificar se a conta PDA já existe
            const accountInfo = await connection.getAccountInfo(pda);
            if (accountInfo) {
                console.log("Game state já existe");
                return;
            }

            // Criar instrução de inicialização
            const initInstruction = new TransactionInstruction({
                keys: [
                    { pubkey: pda, isSigner: false, isWritable: true },
                    { pubkey: publicKey, isSigner: true, isWritable: true },
                    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                ],
                programId: PROGRAM_ID,
                data: Buffer.from([0]), // Instrução 0 = initialize
            });

            const transaction = new Transaction().add(initInstruction);
            transaction.feePayer = publicKey;
            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;

            const signedTx = await provider.signTransaction(transaction);
            const signature = await connection.sendRawTransaction(signedTx.serialize());
            await connection.confirmTransaction(signature, "confirmed");

            console.log("Game state inicializado:", signature);
        } catch (error) {
            console.error("Erro ao inicializar game state:", error);
        }
    }

    //==========================================================================// 

    async function updatePlaysLeft() {
        if (!gameStatePDA) return;

        try {
            const accountInfo = await connection.getAccountInfo(gameStatePDA);
            if (!accountInfo) {
                playsLeftDiv.innerText = "Jogadas restantes: 0";
                return 0;
            }

            // Parsear os dados da conta (simplificado)
            // Assumindo que plays_left está no byte 32 (após o Pubkey de 32 bytes)
            const playsLeft = accountInfo.data[32];
            playsLeftDiv.innerHTML = `<div class="scoretop">Jogadas</div><div>${playsLeft}</div>`;
            
            // Habilitar/desabilitar botões baseado nas jogadas restantes
            const moveButtons = document.querySelectorAll(".moveBtn");
            moveButtons.forEach(btn => {
                btn.disabled = playsLeft === 0;
            });

            return playsLeft;
        } catch (error) {
            console.error("Erro ao obter jogadas restantes:", error);
            playsLeftDiv.innerText = "Erro ao buscar jogadas";
            return 0;
        }
    }

    //==========================================================================// 

    async function payForPlays() {
        if (!publicKey || !gameStatePDA) return;

        try {
            paymentStatus.innerText = "Processando pagamento...";
            payForPlaysBtn.disabled = true;

            // Criar instrução de pagamento
            const payInstruction = new TransactionInstruction({
                keys: [
                    { pubkey: gameStatePDA, isSigner: false, isWritable: true },
                    { pubkey: publicKey, isSigner: true, isWritable: true },
                    { pubkey: TREASURY_PUBKEY, isSigner: false, isWritable: true },
                    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                ],
                programId: PROGRAM_ID,
                data: Buffer.from([2]), // Instrução 2 = pay_for_plays
            });

            const transaction = new Transaction().add(payInstruction);
            transaction.feePayer = publicKey;
            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;

            const signedTx = await provider.signTransaction(transaction);
            const signature = await connection.sendRawTransaction(signedTx.serialize());
            await connection.confirmTransaction(signature, "confirmed");

            paymentStatus.style.color = "green";
            paymentStatus.innerText = "Pagamento realizado com sucesso! Você ganhou 5 jogadas.";
            
            // Atualizar jogadas restantes
            await updatePlaysLeft();
            
            // Atualizar saldo da carteira
            await updateWalletBalance();

            console.log("Pagamento realizado:", signature);
        } catch (error) {
            console.error("Erro no pagamento:", error);
            paymentStatus.style.color = "red";
            paymentStatus.innerText = "Erro no pagamento: " + error.message;
        } finally {
            payForPlaysBtn.disabled = false;
        }
    }

    //==========================================================================// 

    async function updateWalletBalance() {
        if (!publicKey) return;

        try {
            const balanceLamports = await connection.getBalance(publicKey);
            const balanceSOL = balanceLamports / solanaWeb3.LAMPORTS_PER_SOL;
            document.getElementById("walletBalance").innerText = `Balance: ${balanceSOL.toFixed(4)} SOL`;
        } catch (error) {
            console.error("Erro ao atualizar saldo:", error);
        }
    }

    //==========================================================================// 

    function createPlayInstruction(playerPubkey, playerMove) {
        return new TransactionInstruction({
            keys: [
                { pubkey: gameStatePDA, isSigner: false, isWritable: true },
                { pubkey: playerPubkey, isSigner: true, isWritable: true },
                { pubkey: TREASURY_PUBKEY, isSigner: false, isWritable: true },
            ],
            programId: PROGRAM_ID,
            data: Buffer.from([1, playerMove]), // Instrução 1 = make_play, seguido do movimento
        });
    }

    //==========================================================================// 

    // Função para animação de resultado (mantida do código original)
    gsap.registerPlugin(SplitText);

    function showAnimatedOutcome(element, text) {
        const safeText = String(text ?? "");

        const span = document.createElement("span");
        span.className = "outcome-text";
        span.textContent = safeText;

        element.innerHTML = "";
        element.appendChild(span);

        try { if (element._split) { element._split.revert(); element._split = null; } } catch(e) {}
        try { if (span._split) { span._split.revert(); span._split = null; } } catch(e) {}
        try { if (element._tl) { element._tl.kill(); element._tl = null; } } catch(e) {}

        span._split = new SplitText(span, { type: "words" });

        element._tl = gsap.from(span._split.words, {
            y: -24,
            scale: 5.5,
            opacity: 0,
            rotation: "random(-30, 30)",
            duration: 0.6,
            ease: "back.out(1.4)",
            stagger: 0.08
        });
    }

    //==========================================================================// 

    // Event listeners para os botões de movimento (atualizado)
    document.querySelectorAll(".moveBtn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const playerMove = parseInt(btn.getAttribute("data-move"));
            btn.disabled = true;

            const modal = document.getElementById("gameModal");
            let playerMoveDisplay = document.getElementById("playerMoveDisplay");
            let contractMoveDisplay = document.getElementById("contractMoveDisplay");
            let roundResult = document.getElementById("roundResult");
            showGameModal();

            document.getElementById("playerMoveDisplay").classList.add("sL01");
            document.getElementById("contractMoveDisplay").classList.add("sR01");

            const moveImages = {
                Rock: "public/svg/armsRL.svg",
                Paper: "public/svg/armsPL.svg",
                Scissors: "public/svg/armsSL.svg"
            };

            let playerChoice = MOVES[parseInt(playerMove)];
            playerMoveDisplay.innerHTML = `<img src="public/svg/armsRL.svg" alt="${playerChoice}" width="80">`;

            roundResult.innerHTML = "";

            let idx = 0;
            const interval = setInterval(() => {
                let currentMove = MOVES[idx % 3];
                contractMoveDisplay.innerHTML = `<img src="${moveImages[currentMove]}" alt="${currentMove}" width="80">`;
                idx++;
            }, 300);

            try {
                // Verificar se tem jogadas restantes
                const playsLeft = await updatePlaysLeft();
                if (playsLeft === 0) {
                    clearInterval(interval);
                    showAnimatedOutcome(roundResult, "Sem jogadas! Pague para continuar.");
                    btn.disabled = false;
                    return;
                }

                // Enviar transação de jogada
                const instruction = createPlayInstruction(publicKey, playerMove);
                const transaction = new Transaction().add(instruction);
                transaction.feePayer = publicKey;
                const { blockhash } = await connection.getLatestBlockhash();
                transaction.recentBlockhash = blockhash;

                const signedTx = await provider.signTransaction(transaction);
                const signature = await connection.sendRawTransaction(signedTx.serialize());
                await connection.confirmTransaction(signature, "confirmed");

                // Atualizar jogadas restantes
                await updatePlaysLeft();

                // Simular resultado do jogo (em um contrato real, isso viria dos logs da transação)
                const programMove = Math.floor(Math.random() * 3);
                const contractMove = MOVES[programMove];
                
                playerMoveDisplay.innerHTML = `<img src="${moveImages[playerChoice]}" alt="${playerChoice}" width="80">`;
                clearInterval(interval);
                contractMoveDisplay.innerHTML = `<img src="${moveImages[contractMove]}" alt="${contractMove}" width="80">`;
                
                document.getElementById("playerMoveDisplay").classList.remove("sL01");
                document.getElementById("contractMoveDisplay").classList.remove("sR01");

                // Determinar resultado
                let outcome;
                if (playerMove === programMove) {
                    outcome = "Empate!";
                } else if (
                    (playerMove === 0 && programMove === 2) ||
                    (playerMove === 1 && programMove === 0) ||
                    (playerMove === 2 && programMove === 1)
                ) {
                    outcome = "Você ganhou!";
                } else {
                    outcome = "Você perdeu!";
                }

                showAnimatedOutcome(roundResult, outcome);

                // Log da transação
                document.getElementById("txLog").classList.remove("hidden");
                let logHtml = `
                    <div class="tx-logint">
                        <h3>Transaction Log</h3>
                        <p><strong>Signature:</strong> ${signature}</p>
                        <p><strong>Status:</strong> Confirmed</p>
                        <p><a href="https://explorer.solana.com/tx/${signature}?cluster=devnet" target="_blank">
                            View on Solana Explorer
                        </a></p>
                    </div>
                `;
                document.getElementById("txLog").innerHTML = logHtml;

            } catch (e) {
                clearInterval(interval);
                contractMoveDisplay.innerText = "Error";
                showAnimatedOutcome(roundResult, e.message || "Erro desconhecido");
            } finally {
                btn.disabled = false;
            }
        });
    });

    //==========================================================================// 

    // Event listeners para modal (mantidos do código original)
    const closeModal = document.getElementById("closeModal");

    function showGameModal() {
        document.getElementById("gameModal").classList.remove('hidden');
        document.body.classList.add('modal-open');
    }

    function hideGameModal() {
        document.getElementById("gameModal").classList.add('hidden');
        document.body.classList.remove('modal-open');
    }

    closeModal.addEventListener('click', hideGameModal);

    //==========================================================================// 

    // Função de conexão da carteira (atualizada)
    async function handleWalletConnect(clickedBtn) {
        if ("solana" in window) {
            provider = window.solana;

            if (!provider.isPhantom) {
                alert("Please install Phantom Wallet.");
                return;
            }

            try {
                const resp = await provider.connect();
                publicKey = resp.publicKey;

                walletInfo.innerText = `Wallet: ${publicKey.toString()}`;
                clickedBtn.style.background = "#22e164";
                clickedBtn.style.color = "white";

                gameDiv.style.display = "block";
                firebaseSection.style.display = "block";
                document.getElementById("chartsSection").classList.remove("hidden");
                document.getElementById("chartsSection2").classList.remove("hidden");
                
                document.getElementById("historyList").classList.remove("hidden");
                document.getElementById("hbtng").classList.remove("hidden");
                document.getElementById("score").classList.remove("hidden");
                document.getElementById("walletGroup").classList.remove("hidden");
                document.getElementById("SRC").classList.remove("hidden");

                // Mostrar elementos do sistema de pagamento
                document.getElementById("paymentSection").classList.remove("hidden");

                // Inicializar game state se necessário
                await initializeGameState();

                // Atualizar informações
                await updateWalletBalance();
                await updatePlaysLeft();

                console.log("Carteira conectada com sucesso");
            } catch (err) {
                alert("Falha na conexão com carteira: " + err.message);
            }
        } else {
            alert("Phantom Wallet não detectada.");
        }
    }

    // Event listeners
    document.querySelectorAll(".connectBtn").forEach(btn => {
        btn.onclick = () => handleWalletConnect(btn);
    });

    // Event listener para o botão de pagamento
    if (payForPlaysBtn) {
        payForPlaysBtn.addEventListener('click', payForPlays);
    }

    //==========================================================================// 

    // Overlay de boas-vindas (mantido do código original)
    const overlay = document.getElementById('intro-overlay');
    const closeBtn = document.getElementById('close-overlay');
    const enterBtn = document.getElementById('enter-btn');

    function showOverlay() {
        overlay.classList.remove('hidden');
        overlay.removeAttribute('aria-hidden');
        document.body.classList.add('modal-open');
        setTimeout(() => closeBtn.focus(), 0);
    }

    function hideOverlay() {
        overlay.classList.add('hidden');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
    }

    overlay.addEventListener('touchmove', (e) => {
        e.stopPropagation();
    }, {
        passive: false
    });

    closeBtn.addEventListener('click', hideOverlay);
    enterBtn.addEventListener('click', hideOverlay);
    overlay.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') hideOverlay();
    });

    //==========================================================================// 

    // Animações dos botões (mantidas do código original)
    const buttons = document.querySelectorAll(".moveBtn");

    buttons.forEach(btn => {
        btn.addEventListener("mouseenter", () => {
            gsap.fromTo(btn, {
                y: -10,
                scale: 1.1,
                duration: 1,
                ease: "power2.out"
            }, {
                y: 0,
                scale: 1,
                rotation: 0,
                duration: 1,
                ease: "power2.inOut"
            });
        });
    });

    //==========================================================================// 

    // Firebase e ranking (mantidos do código original, mas podem ser removidos se não necessários)
    registerFirebaseBtn.onclick = async() => {
        if (!publicKey) {
            alert("Conecte sua carteira primeiro.");
            return;
        }

        firebaseStatus.style.color = "black";
        firebaseStatus.innerText = "Register in progress";

        try {
            const nickname = nicknameInput.value.trim() || null;
            const playsLeft = await updatePlaysLeft();

            const col = window._firestoreFuncs.collection(window._firestore, "players");
            const docRef = window._firestoreFuncs.doc(col, publicKey.toString());

            await window._firestoreFuncs.setDoc(docRef, {
                pubkey: publicKey.toString(),
                nickname,
                playsLeft,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            firebaseStatus.style.color = "green";
            firebaseStatus.innerText = "Done!";
        } catch (e) {
            firebaseStatus.style.color = "red";
            firebaseStatus.innerText = "Erro ao registrar no Firebase: " + e.message;
        }
    };

})();

