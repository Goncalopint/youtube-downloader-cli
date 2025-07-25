
# Youtube Video Downloader (ytvd)

Ferramenta de linha de comandos para baixar vídeos ou áudios do YouTube de forma simples e rápida.

## Funcionalidades

- Baixa vídeos ou apenas o áudio de qualquer URL do YouTube.
- Permite escolher o diretório do ficheiro.
- Gera um nome limpo para o ficheiro de forma automática.
- Mensagens de status detalhadas durante o download.

## Requisitos

- Node.js (v18 ou superior recomendado)
- yt-dlp instalado e disponível no PATH do sistema
- ffmpeg instalado e disponível no PATH do sistema

## Instalação

1. Clone este repositório:
	```powershell
	git clone https://github.com/Goncalopint/youtube-downloader-cli.git
	cd youtube-downloader-cli
	```

2. Instale as dependências:
	```powershell
	npm install
	```


3. Instale o pacote globalmente (opcional, para usar o comando `ytvd` em qualquer lugar):
	```powershell
	npm install -g .
	```
    > **Observação:** Na primeira vez que estiver desenvolvendo ou testando localmente, pode ser necessário rodar `npm link` para disponibilizar o comando no terminal. Para uso global após instalação, utilize apenas `npm install -g .`.

4. Certifique-se de que `yt-dlp` e `ffmpeg` estão instalados e disponíveis no PATH do sistema.

## Uso

No PowerShell ou terminal, execute:

```powershell
ytvd "<URL do vídeo>" --audio --output "C:\Users\NomeUtilizador\Downloads"
```

Pode usar `--audio` para baixar apenas o áudio ou `--video` para baixar o vídeo com áudio.

**Exemplo:**

```powershell
ytvd "https://youtu.be/<ID_VIDEO>" --video --output "C:\Users\NomeUtilizador"
```
```

**Saída esperada:**
```
[DEBUG] 🔍 A obter metadata do url...
[DEBUG] ✅ Metadata obtida com sucesso
[DEBUG] 🚀 A guardar ficheiro em: C:\Users\NomeUtilizador\<Nome_do_Arquivo>.m4a
[DEBUG] 🚀 A iniciar download...
...
[SUCCESS] ✅ Download concluído com sucesso: C:\Users\NomeUtilizador\<Nome_do_Arquivo>.m4a
```

## Opções

- `--video` : Baixar vídeo (com áudio)
- `--audio` : Baixar apenas o áudio
- `--output <path>` : Caminho obrigatório para salvar o arquivo

## Observações

- Sempre coloque o URL entre aspas, especialmente no PowerShell, para evitar erros com caracteres especiais como `&`.
- O nome do arquivo é gerado automaticamente a partir do título do vídeo.

## Estrutura do Projeto
- `src/` - Código fonte principal
- `bin/` - Scripts executáveis
- `package.json` - Dependências e configurações do projeto
- `tsconfig.json` - Configuração do TypeScript

## Licença

MIT
