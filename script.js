document.addEventListener('DOMContentLoaded', function() {
  // Função auxiliar para criar cores RGB
  function rgb(r, g, b) {
    return PDFLib.rgb(r / 255, g / 255, b / 255);
  }

  // Configurações de fontes
  const configFonts = {
    certificado: {
      nome: { family: 'Arial Black', size: 24, color: rgb(0, 0, 0) },
      cpf: { family: 'Arial Black', size: 18, color: rgb(0, 0, 0) },
      curso: { family: 'Trebuchet MS', size: 18, color: rgb(0, 0, 0) },
      cidade: { family: 'Arial Black', size: 16, color: rgb(0, 0, 0) },
      numero: { family: 'Arial Black', size: 16, color: rgb(0, 0, 0) }
    },
    carteira: {
      nome: { family: 'Arial Black', size: 7, style: 'Bold', color: rgb(0, 0, 0) },
      cpf: { family: 'Arial Black', size: 10, style: 'Regular', color: rgb(0, 0, 0) },
      data: { family: 'Arial', size: 8, color: rgb(0, 0, 0) },
      curso: { family: 'Arial', size: 6, color: rgb(0, 0, 0) }
    }
  };

  // Configurações globais com os novos templates
  const config = {
    templates: {
      basculante: './templates/basculante_template.pdf',
      guindauto: './templates/guindauto_template.pdf',
      default: './templates/certificado_template.pdf',
      carteira: './templates/carteira_template.pdf'
    }
  };

  // Objeto servicos
  const servicos = {
    // Método para carregar template com tratamento de erros melhorado
    async carregarTemplate(tipoCurso) {
      try {
        // Determina qual template usar baseado no tipo de curso
        let templateName;
        if (tipoCurso === "Guindauto - Munck") {
          templateName = config.templates.guindauto;
        } else if (tipoCurso === "Caminhão Basculante") {
          templateName = config.templates.basculante;
        } else {
          templateName = config.templates.default;
        }

        console.log(`Carregando template: ${templateName}`);
        const response = await fetch(templateName);
        
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
        }
        
        const buffer = await response.arrayBuffer();
        
        if (buffer.byteLength === 0) {
          throw new Error('Arquivo PDF está vazio');
        }
        
        // Verificação básica de cabeçalho PDF
        const header = new Uint8Array(buffer.slice(0, 5));
        if (String.fromCharCode(...header) !== '%PDF-') {
          throw new Error('Arquivo não é um PDF válido (cabeçalho ausente)');
        }
        
        return buffer;
      } catch (error) {
        console.error('Erro ao carregar template:', error);
        throw new Error(`Não foi possível carregar o template para ${tipoCurso}. ${error.message}`);
      }
    },

    // Método para carregar template da carteira
    async carregarTemplateCarteira() {
      try {
        console.log('Carregando template da carteira...');
        const response = await fetch(config.templates.carteira);
        
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
        }
        
        const buffer = await response.arrayBuffer();
        
        if (buffer.byteLength === 0) {
          throw new Error('Arquivo PDF está vazio');
        }
        
        // Verificação básica de cabeçalho PDF
        const header = new Uint8Array(buffer.slice(0, 5));
        if (String.fromCharCode(...header) !== '%PDF-') {
          throw new Error('Arquivo não é um PDF válido (cabeçalho ausente)');
        }
        
        return buffer;
      } catch (error) {
        console.error('Erro ao carregar template da carteira:', error);
        throw new Error('Não foi possível carregar o template da carteira. ' + error.message);
      }
    },

    // Método para gerar PDF
    async gerarPDF(pdfBytes, fileName) {
      return new Promise((resolve) => {
        try {
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          
          link.onclick = () => {
            setTimeout(() => {
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              resolve();
            }, 100);
          };
          
          link.click();
        } catch (error) {
          console.error('Erro ao gerar PDF:', error);
          throw error;
        }
      });
    },

    // Método para gerar certificado específico para cada curso
    async certificado(dados) {
      const loadingElement = document.getElementById('loading');
      loadingElement.style.display = 'block';
      
      try {
        console.log(`Gerando certificado para: ${dados.cursos[0]}`);
        const templateBytes = await this.carregarTemplate(dados.cursos[0]);
        
        const pdfDoc = await PDFLib.PDFDocument.load(templateBytes);
        pdfDoc.registerFontkit(fontkit);
        
        // Carregar fontes
        const fontNome = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
        const fontCPF = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
        const fontCurso = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesRoman);
        const fontCidade = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
        const fontNumero = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

        const page = pdfDoc.getPages()[0];
        const { width, height } = page.getSize();
      
        // Posições dos textos
        const positions = {
          nome: { y: height - 200 },
          cpf: { y: height - 230.5 },
          curso: { y: height - 295.5 },
          cidade: { y: height - 350 },
          numero: { x: 685, y: height - 583 }
        };

        // Preencher campos
        page.drawText(dados.nome.toUpperCase(), {
          x: width / 2 - (fontNome.widthOfTextAtSize(dados.nome.toUpperCase(), configFonts.certificado.nome.size) / 2),
          y: positions.nome.y,
          size: configFonts.certificado.nome.size,
          font: fontNome,
          color: configFonts.certificado.nome.color
        });

        page.drawText(dados.cpf, {
          x: width / 2 - (fontCPF.widthOfTextAtSize(dados.cpf, configFonts.certificado.cpf.size) / 2),
          y: positions.cpf.y,
          size: configFonts.certificado.cpf.size,
          font: fontCPF,
          color: configFonts.certificado.cpf.color
        });

        const textoCurso = `Capacitado para operador de ${dados.cursos[0]}`;
        page.drawText(textoCurso, {
          x: width / 2 - (fontCurso.widthOfTextAtSize(textoCurso, configFonts.certificado.curso.size) / 2),
          y: positions.curso.y,
          size: configFonts.certificado.curso.size,
          font: fontCurso,
          color: configFonts.certificado.curso.color
        });

        page.drawText(dados.cidade, {
          x: width / 2 - (fontCidade.widthOfTextAtSize(dados.cidade, configFonts.certificado.cidade.size) / 2),
          y: positions.cidade.y,
          size: configFonts.certificado.cidade.size,
          font: fontCidade,
          color: configFonts.certificado.cidade.color
        });

        page.drawText(`Nº: ${dados.numeroCertificado}`, {
          x: positions.numero.x,
          y: positions.numero.y,
          size: configFonts.certificado.numero.size,
          font: fontNumero,
          color: configFonts.certificado.numero.color
        });

        const pdfBytes = await pdfDoc.save();
        const nomeArquivo = `Certificado_${dados.cursos[0].replace(/\s+/g, '_')}_${dados.nome.replace(/\s+/g, '_')}.pdf`;
        await this.gerarPDF(pdfBytes, nomeArquivo);
        
        console.log('Certificado gerado com sucesso!');
      } catch (error) {
        console.error('Erro ao gerar certificado:', error);
        alert('Erro ao gerar certificado: ' + error.message);
      } finally {
        loadingElement.style.display = 'none';
      }
    },

    // Método para gerar carteira
    async carteira(dados) {
      const loadingElement = document.getElementById('loading');
      loadingElement.style.display = 'block';
      
      try {
        console.log('Gerando carteira...');
        const templateBytes = await this.carregarTemplateCarteira();
        
        const pdfDoc = await PDFLib.PDFDocument.load(templateBytes);
        pdfDoc.registerFontkit(fontkit);
      
        // Carregar fontes
        const fontNome = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
        const fontCPF = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
        const fontData = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
        const fontCurso = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

        const page = pdfDoc.getPages()[0];
        const { width, height } = page.getSize();
      
        // Posições dos textos
        const positions = {
          nome: { x: 13, y: height - 58 },
          cpf: { x: 100, y: height - 80 },
          data: { x: 184, y: height - 260 },
          cursos: { startX: 94, startY: height - 126, lineHeight: 7 }
        };

        // Preencher campos
        page.drawText(dados.nome.toUpperCase(), {
          x: positions.nome.x,
          y: positions.nome.y,
          size: configFonts.carteira.nome.size,
          font: fontNome,
          color: configFonts.carteira.nome.color
        });

        page.drawText(dados.cpf.toUpperCase(), {
          x: positions.cpf.x,
          y: positions.cpf.y,
          size: configFonts.carteira.cpf.size,
          font: fontCPF,
          color: configFonts.carteira.cpf.color
        });

        page.drawText(dados.dataConclusao, {
          x: positions.data.x,
          y: positions.data.y,
          size: configFonts.carteira.data.size,
          font: fontData,
          color: configFonts.carteira.data.color
        });

        // Preencher cursos
        let currentY = positions.cursos.startY;
        dados.cursos.slice(0, 10).forEach(curso => {
          page.drawText(`OPERADOR DE ${curso.toUpperCase()}`, {
            x: positions.cursos.startX,
            y: currentY,
            size: configFonts.carteira.curso.size,
            font: fontCurso,
            color: configFonts.carteira.curso.color
          });
          currentY -= positions.cursos.lineHeight;
        });

        const pdfBytes = await pdfDoc.save();
        await this.gerarPDF(pdfBytes, `Carteira_${dados.nome.replace(/\s+/g, '_')}.pdf`);
        console.log('Carteira gerada com sucesso!');
      } catch (error) {
        console.error('Erro ao gerar carteira:', error);
        alert('Erro ao gerar carteira: ' + error.message);
      } finally {
        loadingElement.style.display = 'none';
      }
    }
  };

  // Event listener para o botão Gerar Documentos
  document.getElementById('gerarDocumentos').addEventListener('click', async function() {
    // Validar campos
    const nome = document.getElementById('nome').value.trim();
    const cpf = document.getElementById('cpf').value.trim();
    const cidade = document.getElementById('cidade').value.trim();
    const numeroCertificado = document.getElementById('numeroCertificado').value.trim();
    const dataConclusao = document.getElementById('dataConclusao').value;
    
    // Obter cursos selecionados
    const checkboxes = document.querySelectorAll('input[name="curso"]:checked');
    const cursos = Array.from(checkboxes).map(cb => cb.value);
    
    // Validações básicas
    if (!nome || !cpf || !cidade || !numeroCertificado || !dataConclusao) {
      alert('Por favor, preencha todos os campos obrigatórios!');
      return;
    }
    
    if (cursos.length === 0) {
      alert('Selecione pelo menos um curso!');
      return;
    }

    // Formatar dados
    const dados = {
      nome,
      cpf,
      cidade,
      cursos,
      numeroCertificado,
      dataConclusao: formatarData(dataConclusao)
    };

    // Gerar documentos
    try {
      console.log('Iniciando geração de documentos...');
      
      // Gerar certificado para cada curso selecionado
      for (const curso of dados.cursos) {
        const dadosCurso = {
          ...dados,
          cursos: [curso] // Envia apenas o curso atual
        };
        
        await servicos.certificado(dadosCurso);
        await new Promise(resolve => setTimeout(resolve, 500)); // Delay entre downloads
      }
      
      // Gerar a carteira (uma única vez com todos os cursos)
      await servicos.carteira(dados);
      
      console.log('Todos os documentos foram gerados com sucesso!');
      alert('Documentos gerados com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar documentos:', error);
      alert('Ocorreu um erro ao gerar os documentos: ' + error.message);
    }
  });

  // Função auxiliar para formatar data
  function formatarData(dataString) {
    try {
      const date = new Date(dataString);
      if (isNaN(date.getTime())) {
        throw new Error('Data inválida');
      }
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return dataString;
    }
  }
});
// inicio de gerador em massa 
document.addEventListener('DOMContentLoaded', function() {
  let contadorCertificados = 0;
  let contadorCarteiras = 0;

  // Função para extrair o ID da planilha a partir da URL
  function extrairIdPlanilha(url) {
    const match = url.match(/\/d\/([^\/]+)/);
    return match ? match[1] : null;
  }

  // Função para carregar os dados da planilha usando a API do OpenSheet
  async function carregarDadosPlanilha(planilhaId) {
    const response = await fetch(`https://opensheet.elk.sh/${planilhaId}/1`);
    if (!response.ok) throw new Error('Erro ao carregar dados da planilha');
    return await response.json();
  }

  // Função para determinar qual template usar baseado no nome do curso
  function determinarTemplate(curso) {
    const cursoLower = curso.toLowerCase();
    
    if (cursoLower.includes('basculante') || cursoLower.includes('caminha basculante')) {
      return 'basculante';
    } else if (cursoLower.includes('guindauto') || cursoLower.includes('munk')) {
      return 'guindauto';
    }
    return 'default';
  }

  // Função para formatar o nome do curso com primeiras letras maiúsculas
  function formatarNomeCurso(curso) {
    if (!curso) return 'Curso Não Definido';
    
    return curso.toLowerCase().split(' ')
      .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
      .join(' ');
  }

  // Função para processar cada linha da planilha e extrair as informações necessárias
  function processarLinhaPlanilha(linha) {
    const cidadeEstado = (linha['E'] || linha['CIDADE'] || '').split('–');
    const cidade = cidadeEstado.length > 1 ? cidadeEstado[cidadeEstado.length - 2].trim() : cidadeEstado[0].trim();

    return {
      nome: linha['A'] || 'Nome Não Definido',
      cpf: linha['B'] || 'CPF Não Definido',
      curso: formatarNomeCurso(linha['C']),
      numeroCertificado: linha['D'] || 'N/A',
      cidade: cidade,
      dataConclusao: linha['F'] || 'N/A'
    };
  }

  // Função para carregar o template PDF
  async function carregarTemplate(tipo) {
    const templates = {
      basculante: './templates/basculante_template.pdf',
      guindauto: './templates/guindauto_template.pdf',
      default: './templates/certificado_template.pdf',
      carteira: './templates/carteira_template.pdf'
    };

    const templatePath = templates[tipo] || templates.default;
    const response = await fetch(templatePath);
    if (!response.ok) {
      throw new Error(`Erro ao carregar template: ${tipo}`);
    }
    return await response.arrayBuffer();
  }

  // Função para gerar o PDF e permitir o download
  async function gerarPDF(pdfBytes, fileName) {
    return new Promise((resolve, reject) => {
      try {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);

        link.click();

        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          resolve();
        }, 100);
      } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        reject(error);
      }
    });
  }

  // Função para gerar certificado
  async function certificado(dados) {
    const loadingElement = document.getElementById('loading');
    loadingElement.style.display = 'block';

    try {
      console.log('Gerando Certificado para:', dados.nome);

      // Determinar qual template usar baseado no curso
      const templateType = determinarTemplate(dados.curso);
      const templateBytes = await carregarTemplate(templateType);
      const pdfDoc = await PDFLib.PDFDocument.load(templateBytes);
      pdfDoc.registerFontkit(fontkit);

      // Carregar fontes
      const fontNome = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
      const fontCPF = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
      const fontCurso = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesRoman);
      const fontCidade = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
      const fontNumero = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

      const page = pdfDoc.getPages()[0];
      const { width, height } = page.getSize();

      // Posições para o certificado (ajustar conforme necessário para cada template)
      const positions = {
        nome: { y: height - 200 },
        cpf: { y: height - 230.5 },
        curso: { y: height - 295.5 },
        cidade: { y: height - 350 },
        numero: { x: 685, y: height - 583 }
      };

      page.drawText(dados.nome.toUpperCase(), {
        x: width / 2 - (fontNome.widthOfTextAtSize(dados.nome.toUpperCase(), 24) / 2),
        y: positions.nome.y,
        size: 24,
        font: fontNome,
        color: PDFLib.rgb(0, 0, 0)
      });

      page.drawText(dados.cpf, {
        x: width / 2 - (fontCPF.widthOfTextAtSize(dados.cpf, 18) / 2),
        y: positions.cpf.y,
        size: 18,
        font: fontCPF,
        color: PDFLib.rgb(0, 0, 0)
      });

      // Texto do curso formatado
      const textoCurso = `Capacitado para operador de ${dados.curso}`;
      page.drawText(textoCurso, {
        x: width / 2 - (fontCurso.widthOfTextAtSize(textoCurso, 18) / 2),
        y: positions.curso.y,
        size: 18,
        font: fontCurso,
        color: PDFLib.rgb(0, 0, 0)
      });

      page.drawText(dados.cidade, {
        x: width / 2 - (fontCidade.widthOfTextAtSize(dados.cidade, 16) / 2),
        y: positions.cidade.y,
        size: 16,
        font: fontCidade,
        color: PDFLib.rgb(0, 0, 0)
      });

      page.drawText(`Nº: ${dados.numeroCertificado}`, {
        x: positions.numero.x,
        y: positions.numero.y,
        size: 16,
        font: fontNumero,
        color: PDFLib.rgb(0, 0, 0)
      });

      const pdfBytes = await pdfDoc.save();
      await gerarPDF(pdfBytes, `Certificado_${dados.cursos[0].replace(/\s+/g, '_')}_${dados.nome.replace(/\s+/g, '_')}.pdf`);
      
      contadorCertificados++;
      document.getElementById('contadorCertificados').innerText = `Certificados gerados: ${contadorCertificados}`;
    } catch (error) {
      console.error('Erro ao gerar certificado:', error);
      alert('Erro ao gerar certificado: ' + error.message);
    } finally {
      loadingElement.style.display = 'none';
    }
  }

  // Método para gerar carteira
  async function carteira(dados) {
    const loadingElement = document.getElementById('loading');
    loadingElement.style.display = 'block';

    try {
      console.log('Gerando Carteira para:', dados.nome);

      const templateBytes = await carregarTemplate('carteira');
      const pdfDoc = await PDFLib.PDFDocument.load(templateBytes);
      pdfDoc.registerFontkit(fontkit);
      
      const page = pdfDoc.getPages()[0];
      const { width, height } = page.getSize();

      // Carregar fontes - usando HelveticaBold para os campos em negrito
      const fontBold = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

      const positions = {
        nome: { x: 13, y: height - 58 },
        cpf: { x: 100, y: height - 80 },
        data: { x: 184, y: height - 260 },
        cursos: { startX: 94, startY: height - 126, lineHeight: 7 }
      };

      // Nome em negrito
      page.drawText(dados.nome.toUpperCase(), {
        x: positions.nome.x,
        y: positions.nome.y,
        size: 8,
        font: fontBold,
        color: PDFLib.rgb(0, 0, 0),
      });

      // CPF em negrito
      page.drawText(dados.cpf, {
        x: positions.cpf.x,
        y: positions.cpf.y,
        size: 11,
        font: fontBold,
        color: PDFLib.rgb(0, 0, 0),
      });

      // Data em negrito
      page.drawText(dados.dataConclusao, {
        x: positions.data.x,
        y: positions.data.y,
        size: 8,
        font: fontBold,
        color: PDFLib.rgb(0, 0, 0),
      });

      // Cursos em fonte regular
      let currentY = positions.cursos.startY;
      dados.cursos.forEach(curso => {
        page.drawText(`OPERADOR DE ${curso.toUpperCase()}`, {
          x: positions.cursos.startX,
          y: currentY,
          size: 6,
          font: fontRegular
        });
        currentY -= positions.cursos.lineHeight;
      });

      const pdfBytes = await pdfDoc.save();
      await gerarPDF(pdfBytes, `Carteira_${dados.nome.replace(/\s+/g, '_')}.pdf`);
      
      contadorCarteiras++;
      document.getElementById('contadorCarteiras').innerText = `Carteiras geradas: ${contadorCarteiras}`;
    } catch (error) {
      console.error('Erro ao gerar carteira:', error);
      alert('Erro ao gerar carteira: ' + error.message);
    } finally {
      loadingElement.style.display = 'none';
    }
  }

  // Função para gerar os certificados e carteiras em massa
  async function gerarDocumentosEmMassa() {
    const urlPlanilha = document.getElementById('planilhaUrl').value.trim();

    if (!urlPlanilha) {
      alert('Por favor, insira a URL da planilha!');
      return;
    }

    const planilhaId = extrairIdPlanilha(urlPlanilha);
    if (!planilhaId) {
      alert('URL inválida. Verifique a URL da planilha!');
      return;
    }

    try {
      const dadosPlanilha = await carregarDadosPlanilha(planilhaId);
      console.log('Dados da planilha carregados:', dadosPlanilha);

      const alunos = {};

      // Começar da segunda linha (índice 1) em vez da terceira
      for (let i = 1; i < dadosPlanilha.length; i++) {
        const linha = dadosPlanilha[i];
        const aluno = processarLinhaPlanilha(linha);

        if (!alunos[aluno.cpf]) {
          alunos[aluno.cpf] = { ...aluno, cursos: [] };
        }

        alunos[aluno.cpf].cursos.push(aluno.curso);
      }

      for (const cpf in alunos) {
        const aluno = alunos[cpf];
        console.log('Processando aluno:', aluno.nome);

        // Gerar certificado para cada curso
        for (let i = 0; i < aluno.cursos.length; i++) {
          const dadosCurso = {
            nome: aluno.nome,
            cpf: aluno.cpf,
            curso: aluno.cursos[i],
            cursos: [aluno.cursos[i]],
            numeroCertificado: aluno.numeroCertificado,
            cidade: aluno.cidade,
            dataConclusao: aluno.dataConclusao
          };

          await certificado(dadosCurso);
        }

        // Gerar carteira com todos os cursos
        const dadosCarteira = {
          nome: aluno.nome,
          cpf: aluno.cpf,
          cursos: aluno.cursos,
          numeroCertificado: aluno.numeroCertificado,
          dataConclusao: aluno.dataConclusao
        };

        await carteira(dadosCarteira);
      }

      alert('Documentos gerados com sucesso!');
    } catch (error) {
      alert(`Erro ao gerar documentos: ${error.message}`);
      console.error(error);
    }
  }

  document.getElementById('gerarEmMassa').addEventListener('click', async function() {
    document.getElementById('gerarEmMassa').disabled = true;
    const loadingElement = document.getElementById('loading');
    loadingElement.style.display = 'block';

    try {
      await gerarDocumentosEmMassa();
    } finally {
      document.getElementById('gerarEmMassa').disabled = false;
      loadingElement.style.display = 'none';
    }
  });
});// inicio função letra
document.addEventListener('DOMContentLoaded', function() {
  // Funções de formatação de texto
  const formatacoesTexto = {
    maiusculo: (texto) => texto.toUpperCase(),
    minusculo: (texto) => texto.toLowerCase(),
    alternado: (texto) => {
      return texto.split('').map((char, index) => 
        index % 2 === 0 ? char.toUpperCase() : char.toLowerCase()
      ).join('');
    },
    inverter: (texto) => texto.split('').reverse().join(''),
    primeiraLetraPalavra: (texto) => {
      return texto.toLowerCase().split(' ')
        .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
        .join(' ');
    },
    primeiraLetraFrase: (texto) => {
      return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
    },
    formatarCPF: (texto) => {
      // Remove tudo que não é dígito
      const cpf = texto.replace(/\D/g, '');
      // Aplica a formatação do CPF
      return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    },
    substituirEspacos: (texto) => texto.replace(/\s+/g, '_')
  };

  // Elementos da interface
  const textarea = document.getElementById('textoInput');
  const btnMaiusculo = document.getElementById('btnMaiusculo');
  const btnMinusculo = document.getElementById('btnMinusculo');
  const btnAlternado = document.getElementById('btnAlternado');
  const btnInverter = document.getElementById('btnInverter');
  const btnPrimeiraLetra = document.getElementById('btnPrimeiraLetra');
  const btnPrimeiraFrase = document.getElementById('btnPrimeiraFrase');
  const btnFormatarCPF = document.getElementById('btnFormatarCPF');
  const btnSubstituirEspacos = document.getElementById('btnSubstituirEspacos');
  const btnSelecionarTudo = document.getElementById('btnSelecionarTudo');

  // Função para aplicar formatação
  function aplicarFormatacao(formatacao) {
    const texto = textarea.value;
    const textoSelecionado = textarea.value.substring(
      textarea.selectionStart,
      textarea.selectionEnd
    );

    if (textoSelecionado) {
      const novoTexto = texto.substring(0, textarea.selectionStart) +
        formatacoesTexto[formatacao](textoSelecionado) +
        texto.substring(textarea.selectionEnd);
      textarea.value = novoTexto;
    } else {
      textarea.value = formatacoesTexto[formatacao](texto);
    }
  }

  // Event listeners para os botões
  btnMaiusculo.addEventListener('click', () => aplicarFormatacao('maiusculo'));
  btnMinusculo.addEventListener('click', () => aplicarFormatacao('minusculo'));
  btnAlternado.addEventListener('click', () => aplicarFormatacao('alternado'));
  btnInverter.addEventListener('click', () => aplicarFormatacao('inverter'));
  btnPrimeiraLetra.addEventListener('click', () => aplicarFormatacao('primeiraLetraPalavra'));
  btnPrimeiraFrase.addEventListener('click', () => aplicarFormatacao('primeiraLetraFrase'));
  btnFormatarCPF.addEventListener('click', () => aplicarFormatacao('formatarCPF'));
  btnSubstituirEspacos.addEventListener('click', () => aplicarFormatacao('substituirEspacos'));

  // Selecionar todo o texto
  btnSelecionarTudo.addEventListener('click', () => {
    textarea.select();
  });

  // ... (o restante do seu código existente para geração de certificados)
});
