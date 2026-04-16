# 1. 軽量なPython環境をベースにする
FROM python:3.11-slim

# 2. 必須システムツールとsudoのインストール
RUN apt-get update && apt-get install -y \
    curl \
    git \
    gnupg \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# 3. Node.jsのインストール
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# 4. GitHub CLI (gh) のインストール
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt-get update && apt-get install -y gh \
    && rm -rf /var/lib/apt/lists/*

# 5. 【修正】AIツールのインストール（Claude Code & Codex CLI）
# どちらもnpmのグローバルパッケージとしてインストールします
RUN npm install -g @anthropic-ai/claude-code @openai/codex

# 6. 一般ユーザー「developer」の作成とsudo権限付与
RUN useradd -m -s /bin/bash developer \
    && echo "developer ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers \
    && mkdir -p /workspace \
    && chown -R developer:developer /workspace

# 以降、developerユーザーとして実行
USER developer
ENV HOME="/home/developer"

# 7. uv のインストール
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/home/developer/.local/bin:$PATH"

# 8. 作業ディレクトリの設定
WORKDIR /workspace

# 9. 所有権を維持したままファイルをコピー
COPY --chown=developer:developer . /workspace