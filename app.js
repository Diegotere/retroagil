// Estado global da aplicação
let appState = {
    questionarios: [
        {
            id: 1,
            titulo: "Retrospectiva Sprint 15",
            status: "ativo",
            perguntas: [
                {
                    id: 1,
                    texto: "O que funcionou bem neste sprint?",
                    opcoes: ["Comunicação", "Planejamento", "Execução", "Colaboração"]
                },
                {
                    id: 2,
                    texto: "O que poderia ser melhorado?",
                    opcoes: ["Processos", "Ferramentas", "Comunicação", "Tempo"]
                }
            ]
        }
    ],
    votos: [
        {
            questionarioId: 1,
            participanteId: "user123",
            respostas: [
                {perguntaId: 1, opcao: "Comunicação"},
                {perguntaId: 2, opcao: "Processos"}
            ]
        }
    ],
    currentQuestionario: null,
    currentScreen: 'dashboard'
};

// Utilitários
const utils = {
    generateId: () => Date.now() + Math.random().toString(36).substr(2, 9),
    
    generateParticipantId: () => 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    
    getQuestionarioById: (id) => appState.questionarios.find(q => q.id == id),
    
    getVotosByQuestionario: (questionarioId) => 
        appState.votos.filter(v => v.questionarioId == questionarioId),
    
    hasVotes: (questionarioId) => 
        appState.votos.some(v => v.questionarioId == questionarioId),
    
    showScreen: (screenId) => {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(`screen-${screenId}`).classList.add('active');
        appState.currentScreen = screenId;
    },
    
    showModal: (modalId) => {
        document.getElementById(modalId).classList.remove('hidden');
    },
    
    hideModal: (modalId) => {
        document.getElementById(modalId).classList.add('hidden');
    },
    
    showNotification: (message, type = 'success') => {
        // Remover notificação existente
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }
        
        // Criar nova notificação
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">×</button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remover após 4 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 4000);
        
        // Permitir fechar manualmente
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }
};

// Gerenciamento de telas
const screenManager = {
    init: () => {
        // Botões de navegação
        document.getElementById('btn-dashboard').addEventListener('click', () => {
            utils.showScreen('dashboard');
            dashboardScreen.render();
        });
        
        document.getElementById('btn-criar-questionario').addEventListener('click', () => {
            utils.showScreen('criar');
            criarScreen.init();
        });
        
        document.getElementById('btn-voltar-criar').addEventListener('click', () => {
            utils.showScreen('dashboard');
            dashboardScreen.render();
        });
        
        document.getElementById('btn-voltar-editar').addEventListener('click', () => {
            utils.showScreen('dashboard');
            dashboardScreen.render();
        });
        
        document.getElementById('btn-voltar-resultados').addEventListener('click', () => {
            utils.showScreen('dashboard');
            dashboardScreen.render();
        });
        
        // Verificar se há parâmetros na URL para votação
        const urlParams = new URLSearchParams(window.location.search);
        const questionarioId = urlParams.get('id');
        
        if (questionarioId) {
            const questionario = utils.getQuestionarioById(questionarioId);
            if (questionario && questionario.status === 'ativo') {
                utils.showScreen('votar');
                votarScreen.init(questionario);
            } else if (questionario && questionario.status === 'finalizado') {
                utils.showScreen('resultados');
                resultadosScreen.init(questionario);
            } else {
                utils.showScreen('dashboard');
                dashboardScreen.render();
                utils.showNotification('Questionário não encontrado ou não disponível.', 'error');
            }
        } else {
            utils.showScreen('dashboard');
            dashboardScreen.render();
        }
    }
};

// Tela Dashboard
const dashboardScreen = {
    render: () => {
        const container = document.getElementById('lista-questionarios');
        
        if (appState.questionarios.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Nenhum questionário criado</h3>
                    <p>Crie seu primeiro questionário para começar!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = appState.questionarios.map(questionario => {
            const totalVotos = utils.getVotosByQuestionario(questionario.id).length;
            const hasVotes = utils.hasVotes(questionario.id);
            
            return `
                <div class="questionario-card">
                    <div class="questionario-header">
                        <h3 class="questionario-title">${questionario.titulo}</h3>
                        <span class="status ${questionario.status === 'ativo' ? 'status--success' : 'status--info'}">
                            ${questionario.status === 'ativo' ? 'Ativo' : 'Finalizado'}
                        </span>
                    </div>
                    
                    <div class="questionario-info">
                        <div>${questionario.perguntas.length} pergunta(s)</div>
                        <div>${totalVotos} voto(s)</div>
                    </div>
                    
                    <div class="questionario-actions">
                        ${questionario.status === 'ativo' ? `
                            <button class="btn btn--outline btn--sm" onclick="dashboardScreen.editarQuestionario(${questionario.id})">
                                Editar
                            </button>
                            <button class="btn btn--secondary btn--sm" onclick="dashboardScreen.compartilhar(${questionario.id})">
                                Compartilhar
                            </button>
                            <button class="btn btn--primary btn--sm" onclick="dashboardScreen.finalizarQuestionario(${questionario.id})">
                                Finalizar
                            </button>
                        ` : `
                            <button class="btn btn--primary btn--sm" onclick="dashboardScreen.verResultados(${questionario.id})">
                                Ver Resultados
                            </button>
                            <button class="btn btn--secondary btn--sm" onclick="dashboardScreen.compartilhar(${questionario.id})">
                                Compartilhar Resultados
                            </button>
                        `}
                    </div>
                </div>
            `;
        }).join('');
    },
    
    editarQuestionario: (id) => {
        const questionario = utils.getQuestionarioById(id);
        if (questionario) {
            appState.currentQuestionario = questionario;
            utils.showScreen('editar');
            editarScreen.init(questionario);
        }
    },
    
    compartilhar: (id) => {
        const questionario = utils.getQuestionarioById(id);
        const baseUrl = window.location.origin + window.location.pathname;
        const link = `${baseUrl}?id=${id}`;
        
        document.getElementById('link-compartilhar').value = link;
        
        // Atualizar título do modal baseado no status
        const modalTitulo = document.querySelector('#modal-compartilhar h3');
        if (questionario.status === 'ativo') {
            modalTitulo.textContent = 'Compartilhar Questionário para Votação';
        } else {
            modalTitulo.textContent = 'Compartilhar Resultados do Questionário';
        }
        
        utils.showModal('modal-compartilhar');
    },
    
    finalizarQuestionario: (id) => {
        const questionario = utils.getQuestionarioById(id);
        const totalVotos = utils.getVotosByQuestionario(id).length;
        
        modalManager.showConfirmation(
            'Finalizar Questionário',
            `Tem certeza que deseja finalizar este questionário? Ele possui ${totalVotos} voto(s). Esta ação não pode ser desfeita.`,
            () => {
                if (questionario) {
                    questionario.status = 'finalizado';
                    dashboardScreen.render();
                    utils.showNotification('Questionário finalizado com sucesso!');
                }
            }
        );
    },
    
    verResultados: (id) => {
        const questionario = utils.getQuestionarioById(id);
        if (questionario) {
            appState.currentQuestionario = questionario;
            utils.showScreen('resultados');
            resultadosScreen.init(questionario);
        }
    }
};

// Tela Criar Questionário
const criarScreen = {
    perguntas: [],
    
    init: () => {
        criarScreen.perguntas = [];
        document.getElementById('titulo-questionario').value = '';
        document.getElementById('lista-perguntas').innerHTML = '';
        
        // Adicionar primeira pergunta
        criarScreen.adicionarPergunta();
        
        // Event listeners
        document.getElementById('btn-adicionar-pergunta').onclick = criarScreen.adicionarPergunta;
        document.getElementById('form-criar-questionario').onsubmit = criarScreen.salvarQuestionario;
    },
    
    adicionarPergunta: () => {
        const perguntaId = utils.generateId();
        const pergunta = {
            id: perguntaId,
            texto: '',
            opcoes: ['', '']
        };
        
        criarScreen.perguntas.push(pergunta);
        criarScreen.renderPerguntas();
    },
    
    renderPerguntas: () => {
        const container = document.getElementById('lista-perguntas');
        
        container.innerHTML = criarScreen.perguntas.map((pergunta, index) => `
            <div class="pergunta-item">
                <div class="pergunta-header">
                    <span class="pergunta-numero">Pergunta ${index + 1}</span>
                    <div class="pergunta-actions">
                        ${criarScreen.perguntas.length > 1 ? `
                            <button type="button" class="btn-icon btn-icon--danger" onclick="criarScreen.removerPergunta(${index})">
                                ×
                            </button>
                        ` : ''}
                    </div>
                </div>
                
                <div class="form-group">
                    <input type="text" class="form-control" placeholder="Digite a pergunta..." 
                           value="${pergunta.texto}" 
                           onchange="criarScreen.updatePerguntaTexto(${index}, this.value)">
                </div>
                
                <div class="opcoes-container">
                    <label class="form-label">Opções de Resposta</label>
                    ${pergunta.opcoes.map((opcao, opcaoIndex) => `
                        <div class="opcao-item">
                            <input type="text" class="form-control" placeholder="Opção ${opcaoIndex + 1}" 
                                   value="${opcao}"
                                   onchange="criarScreen.updateOpcao(${index}, ${opcaoIndex}, this.value)">
                            ${pergunta.opcoes.length > 2 ? `
                                <button type="button" class="btn-remover-opcao" onclick="criarScreen.removerOpcao(${index}, ${opcaoIndex})">
                                    ×
                                </button>
                            ` : ''}
                        </div>
                    `).join('')}
                    
                    <button type="button" class="btn btn--outline btn--sm" onclick="criarScreen.adicionarOpcao(${index})">
                        + Adicionar Opção
                    </button>
                </div>
            </div>
        `).join('');
    },
    
    updatePerguntaTexto: (index, texto) => {
        criarScreen.perguntas[index].texto = texto;
    },
    
    updateOpcao: (perguntaIndex, opcaoIndex, valor) => {
        criarScreen.perguntas[perguntaIndex].opcoes[opcaoIndex] = valor;
    },
    
    adicionarOpcao: (perguntaIndex) => {
        criarScreen.perguntas[perguntaIndex].opcoes.push('');
        criarScreen.renderPerguntas();
    },
    
    removerOpcao: (perguntaIndex, opcaoIndex) => {
        if (criarScreen.perguntas[perguntaIndex].opcoes.length > 2) {
            criarScreen.perguntas[perguntaIndex].opcoes.splice(opcaoIndex, 1);
            criarScreen.renderPerguntas();
        }
    },
    
    removerPergunta: (index) => {
        if (criarScreen.perguntas.length > 1) {
            criarScreen.perguntas.splice(index, 1);
            criarScreen.renderPerguntas();
        }
    },
    
    salvarQuestionario: (e) => {
        e.preventDefault();
        
        const titulo = document.getElementById('titulo-questionario').value.trim();
        
        if (!titulo) {
            utils.showNotification('Por favor, informe o título do questionário.', 'error');
            return;
        }
        
        // Validar perguntas
        const perguntasValidas = criarScreen.perguntas.filter(pergunta => {
            const textoValido = pergunta.texto.trim();
            const opcoesValidas = pergunta.opcoes.filter(opcao => opcao.trim()).length >= 2;
            return textoValido && opcoesValidas;
        });
        
        if (perguntasValidas.length === 0) {
            utils.showNotification('Por favor, adicione pelo menos uma pergunta válida com pelo menos 2 opções.', 'error');
            return;
        }
        
        // Criar questionário
        const novoQuestionario = {
            id: utils.generateId(),
            titulo: titulo,
            status: 'ativo',
            perguntas: perguntasValidas.map(pergunta => ({
                ...pergunta,
                opcoes: pergunta.opcoes.filter(opcao => opcao.trim())
            }))
        };
        
        appState.questionarios.push(novoQuestionario);
        
        // Voltar para dashboard
        utils.showScreen('dashboard');
        dashboardScreen.render();
        utils.showNotification('Questionário criado com sucesso!');
    }
};

// Tela Editar Questionário
const editarScreen = {
    questionario: null,
    
    init: (questionario) => {
        editarScreen.questionario = JSON.parse(JSON.stringify(questionario)); // Deep copy
        
        document.getElementById('titulo-questionario-editar').value = questionario.titulo;
        
        // Mostrar aviso se já tem votos
        const hasVotes = utils.hasVotes(questionario.id);
        const aviso = document.getElementById('aviso-votos');
        if (hasVotes) {
            aviso.classList.remove('hidden');
        } else {
            aviso.classList.add('hidden');
        }
        
        editarScreen.renderPerguntas();
        
        // Event listeners
        document.getElementById('btn-adicionar-pergunta-editar').onclick = editarScreen.adicionarPergunta;
        document.getElementById('form-editar-questionario').onsubmit = editarScreen.salvarAlteracoes;
    },
    
    adicionarPergunta: () => {
        const perguntaId = utils.generateId();
        const pergunta = {
            id: perguntaId,
            texto: '',
            opcoes: ['', '']
        };
        
        editarScreen.questionario.perguntas.push(pergunta);
        editarScreen.renderPerguntas();
    },
    
    renderPerguntas: () => {
        const container = document.getElementById('lista-perguntas-editar');
        
        container.innerHTML = editarScreen.questionario.perguntas.map((pergunta, index) => `
            <div class="pergunta-item">
                <div class="pergunta-header">
                    <span class="pergunta-numero">Pergunta ${index + 1}</span>
                    <div class="pergunta-actions">
                        ${editarScreen.questionario.perguntas.length > 1 ? `
                            <button type="button" class="btn-icon btn-icon--danger" onclick="editarScreen.removerPergunta(${index})">
                                ×
                            </button>
                        ` : ''}
                    </div>
                </div>
                
                <div class="form-group">
                    <input type="text" class="form-control" placeholder="Digite a pergunta..." 
                           value="${pergunta.texto}" 
                           onchange="editarScreen.updatePerguntaTexto(${index}, this.value)">
                </div>
                
                <div class="opcoes-container">
                    <label class="form-label">Opções de Resposta</label>
                    ${pergunta.opcoes.map((opcao, opcaoIndex) => `
                        <div class="opcao-item">
                            <input type="text" class="form-control" placeholder="Opção ${opcaoIndex + 1}" 
                                   value="${opcao}"
                                   onchange="editarScreen.updateOpcao(${index}, ${opcaoIndex}, this.value)">
                            ${pergunta.opcoes.length > 2 ? `
                                <button type="button" class="btn-remover-opcao" onclick="editarScreen.removerOpcao(${index}, ${opcaoIndex})">
                                    ×
                                </button>
                            ` : ''}
                        </div>
                    `).join('')}
                    
                    <button type="button" class="btn btn--outline btn--sm" onclick="editarScreen.adicionarOpcao(${index})">
                        + Adicionar Opção
                    </button>
                </div>
            </div>
        `).join('');
    },
    
    updatePerguntaTexto: (index, texto) => {
        editarScreen.questionario.perguntas[index].texto = texto;
    },
    
    updateOpcao: (perguntaIndex, opcaoIndex, valor) => {
        editarScreen.questionario.perguntas[perguntaIndex].opcoes[opcaoIndex] = valor;
    },
    
    adicionarOpcao: (perguntaIndex) => {
        editarScreen.questionario.perguntas[perguntaIndex].opcoes.push('');
        editarScreen.renderPerguntas();
    },
    
    removerOpcao: (perguntaIndex, opcaoIndex) => {
        if (editarScreen.questionario.perguntas[perguntaIndex].opcoes.length > 2) {
            editarScreen.questionario.perguntas[perguntaIndex].opcoes.splice(opcaoIndex, 1);
            editarScreen.renderPerguntas();
        }
    },
    
    removerPergunta: (index) => {
        if (editarScreen.questionario.perguntas.length > 1) {
            editarScreen.questionario.perguntas.splice(index, 1);
            editarScreen.renderPerguntas();
        }
    },
    
    salvarAlteracoes: (e) => {
        e.preventDefault();
        
        const titulo = document.getElementById('titulo-questionario-editar').value.trim();
        
        if (!titulo) {
            utils.showNotification('Por favor, informe o título do questionário.', 'error');
            return;
        }
        
        // Validar perguntas
        const perguntasValidas = editarScreen.questionario.perguntas.filter(pergunta => {
            const textoValido = pergunta.texto.trim();
            const opcoesValidas = pergunta.opcoes.filter(opcao => opcao.trim()).length >= 2;
            return textoValido && opcoesValidas;
        });
        
        if (perguntasValidas.length === 0) {
            utils.showNotification('Por favor, adicione pelo menos uma pergunta válida com pelo menos 2 opções.', 'error');
            return;
        }
        
        // Atualizar questionário original
        const questionarioOriginal = utils.getQuestionarioById(editarScreen.questionario.id);
        if (questionarioOriginal) {
            questionarioOriginal.titulo = titulo;
            questionarioOriginal.perguntas = perguntasValidas.map(pergunta => ({
                ...pergunta,
                opcoes: pergunta.opcoes.filter(opcao => opcao.trim())
            }));
        }
        
        // Voltar para dashboard
        utils.showScreen('dashboard');
        dashboardScreen.render();
        utils.showNotification('Questionário atualizado com sucesso!');
    }
};

// Tela Votação
const votarScreen = {
    questionario: null,
    respostas: {},
    
    init: (questionario) => {
        votarScreen.questionario = questionario;
        votarScreen.respostas = {};
        
        document.getElementById('titulo-votacao').textContent = questionario.titulo;
        
        votarScreen.renderPerguntas();
        
        document.getElementById('form-votacao').onsubmit = votarScreen.submeterVoto;
    },
    
    renderPerguntas: () => {
        const container = document.getElementById('perguntas-votacao');
        
        container.innerHTML = votarScreen.questionario.perguntas.map((pergunta, index) => `
            <div class="pergunta-votacao">
                <h3>${pergunta.texto}</h3>
                <div class="opcoes-votacao">
                    ${pergunta.opcoes.map((opcao, opcaoIndex) => `
                        <label class="opcao-radio">
                            <input type="radio" name="pergunta_${pergunta.id}" value="${opcao}" 
                                   onchange="votarScreen.updateResposta(${pergunta.id}, '${opcao}')">
                            <span>${opcao}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `).join('');
    },
    
    updateResposta: (perguntaId, opcao) => {
        votarScreen.respostas[perguntaId] = opcao;
        
        // Atualizar visual da opção selecionada
        document.querySelectorAll(`input[name="pergunta_${perguntaId}"]`).forEach(input => {
            input.closest('.opcao-radio').classList.toggle('selected', input.checked);
        });
    },
    
    submeterVoto: (e) => {
        e.preventDefault();
        
        // Verificar se todas as perguntas foram respondidas
        const perguntasRespondidas = Object.keys(votarScreen.respostas).length;
        const totalPerguntas = votarScreen.questionario.perguntas.length;
        
        if (perguntasRespondidas < totalPerguntas) {
            utils.showNotification('Por favor, responda todas as perguntas antes de confirmar.', 'warning');
            return;
        }
        
        // Criar voto
        const voto = {
            questionarioId: votarScreen.questionario.id,
            participanteId: utils.generateParticipantId(),
            respostas: votarScreen.questionario.perguntas.map(pergunta => ({
                perguntaId: pergunta.id,
                opcao: votarScreen.respostas[pergunta.id]
            }))
        };
        
        appState.votos.push(voto);
        
        // Ir para tela de sucesso
        utils.showScreen('sucesso');
        
        // Configurar botão de ver resultados
        document.getElementById('btn-ver-resultados-sucesso').onclick = () => {
            appState.currentQuestionario = votarScreen.questionario;
            utils.showScreen('resultados');
            resultadosScreen.init(votarScreen.questionario);
        };
    }
};

// Tela Resultados
const resultadosScreen = {
    questionario: null,
    
    init: (questionario) => {
        resultadosScreen.questionario = questionario;
        
        document.getElementById('titulo-resultados').textContent = `Resultados: ${questionario.titulo}`;
        
        const votos = utils.getVotosByQuestionario(questionario.id);
        document.getElementById('total-participantes').textContent = `${votos.length} participante(s)`;
        
        resultadosScreen.renderGraficos();
    },
    
    renderGraficos: () => {
        const container = document.getElementById('graficos-resultados');
        const votos = utils.getVotosByQuestionario(resultadosScreen.questionario.id);
        
        if (votos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Nenhum voto registrado</h3>
                    <p>Ainda não há votos para este questionário.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = resultadosScreen.questionario.perguntas.map((pergunta, index) => `
            <div class="grafico-item">
                <h4 class="grafico-titulo">${pergunta.texto}</h4>
                <div class="chart-container">
                    <canvas id="chart-${pergunta.id}"></canvas>
                </div>
            </div>
        `).join('');
        
        // Gerar gráficos
        setTimeout(() => {
            resultadosScreen.questionario.perguntas.forEach(pergunta => {
                resultadosScreen.criarGrafico(pergunta, votos);
            });
        }, 100);
    },
    
    criarGrafico: (pergunta, votos) => {
        const ctx = document.getElementById(`chart-${pergunta.id}`).getContext('2d');
        
        // Contar votos por opção
        const contadores = {};
        pergunta.opcoes.forEach(opcao => {
            contadores[opcao] = 0;
        });
        
        votos.forEach(voto => {
            const resposta = voto.respostas.find(r => r.perguntaId === pergunta.id);
            if (resposta && contadores.hasOwnProperty(resposta.opcao)) {
                contadores[resposta.opcao]++;
            }
        });
        
        const labels = Object.keys(contadores);
        const data = Object.values(contadores);
        const total = data.reduce((sum, value) => sum + value, 0);
        
        // Cores do gráfico
        const colors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325', '#944454', '#13343B'];
        
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels.map(label => {
                    const count = contadores[label];
                    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                    return `${label} (${count} - ${percentage}%)`;
                }),
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }
};

// Gerenciador de Modais
const modalManager = {
    init: () => {
        // Modal de confirmação
        document.getElementById('modal-cancelar').addEventListener('click', () => {
            utils.hideModal('modal-confirmacao');
        });
        
        // Modal de compartilhar
        document.getElementById('modal-fechar-compartilhar').addEventListener('click', () => {
            utils.hideModal('modal-compartilhar');
        });
        
        document.getElementById('btn-copiar-link').addEventListener('click', () => {
            const linkInput = document.getElementById('link-compartilhar');
            linkInput.select();
            linkInput.setSelectionRange(0, 99999); // Para dispositivos móveis
            
            try {
                document.execCommand('copy');
                utils.showNotification('Link copiado para a área de transferência!');
            } catch (err) {
                // Fallback para navegadores que não suportam execCommand
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(linkInput.value).then(() => {
                        utils.showNotification('Link copiado para a área de transferência!');
                    });
                } else {
                    utils.showNotification('Por favor, copie o link manualmente.', 'warning');
                }
            }
            
            const btn = document.getElementById('btn-copiar-link');
            const originalText = btn.textContent;
            btn.textContent = 'Copiado!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        });
        
        // Fechar modais clicando fora
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        });
    },
    
    showConfirmation: (titulo, mensagem, callback) => {
        document.getElementById('modal-titulo').textContent = titulo;
        document.getElementById('modal-mensagem').textContent = mensagem;
        
        document.getElementById('modal-confirmar').onclick = () => {
            utils.hideModal('modal-confirmacao');
            callback();
        };
        
        utils.showModal('modal-confirmacao');
    }
};

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => {
    screenManager.init();
    modalManager.init();
});