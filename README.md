# DXTranslate

![License](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)
![Version](https://img.shields.io/badge/Version-1.0.0-orange.svg)
![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)

A simple, straightforward frontend translator powered by the DeepL API.

![DXTranslate Web Screenshot](./screenshot/img.png)

## 💡 Why DXTranslate?

The official [DeepL website](https://deepl.com) can feel a bit bloated and slow at times. I wanted something lightweight and snappy. That’s why I created DXTranslate! It’s a minimalistic version that gets the job done without fuss. Plus, you don’t need an API key or token—just input your text and go! 🚀✨

## ✨ Features

- **Privacy First**: No ads, cookies or tracking. 🍪
- **Token-Free**: No need for API keys; just start translating! 🔑❌
- **Self-Host**: Want to run it on your own server? Go for it! 💻🚀
- **Lightweight**: Fast response times without all the bloat. ⚡

## ⚠️ Disclaimer

DXTranslate uses DeepL's internal browser endpoint, **not** the official API. This may violate DeepL's Terms of Service — use at your own risk. The endpoint may stop working without notice.

## 📦 Getting Started

```bash
# clone the repository
git clone https://github.com/ridzimeko/DXTranslate.git

# change project directory
cd dxtranslate

# install dependencies
pnpm i

# start dev sever
pnpm dev
```

## ⚙️ Configuration

| Environment Variable | Default                          | Description                                          |
| -------------------- | -------------------------------- | ---------------------------------------------------- |
| `DEEPL_BASE_URL`     | `https://www2.deepl.com/jsonrpc` | Override the DeepL endpoint URL (useful for proxies) |

## 🤝 Contributing

Got ideas or want to help? Fantastic! You can follow these steps:

- Fork the repo
- Create a new branch (git checkout -b improve-feature)
- Make the appropriate changes in the files
- Add changes to reflect the changes made
- Commit your changes (git commit -am 'Improve feature')
- Push to the branch (git push origin improve-feature)
- Create a Pull Request

## 📜 License

This project is licensed under the **AGPL-3.0**.

Happy translating! 🌍💬
