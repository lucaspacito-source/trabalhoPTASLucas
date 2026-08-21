import app from "./app.js"

import { readProducts, readUsers, writeProducts, writeUsers } from "./db.js"

import dotenv from "dotenv"

dotenv.config()

app.listen(process.env.PORTA, () => {
    console.log("Servidor rodando na Porta " + process.env.PORTA)
})

app.get("/", async (req, res) => {
    res.send("Seja bem vindo !!!")
})

app.get("/users", async (req, res) => {
    const { maior } = req.query;
    let users = await readUsers();
    if (maior) {
        users = users.filter((u) => u.idade >= Number(maior));
    }
    res.json(users);
});

app.get('/users/:id', async (req, res) => {
    const users = await readUsers()
    const user = users.find(u => u.id === Number(req.params.id))

    if (!user) return res.status(404).json({ erro: 'Usuário não encontrado' })
    res.json(user)
})



app.get("/products/:id", async (req, res) => {
    const products = await readProducts()
    const product = products.find(p => p.id === Number(req.params.id))
    if (!product) {
        return res.status(404).json({
            status: 404,
            message: "Produto não encontrado"
        })
    }
    res.json(product)
}
)

app.get("/products", async (req, res) => {
    let products = await readProducts()
    const { min } = req.query
    if (min) {
        products = products.filter(p => p.preco >= parseFloat(min))
    }
    res.json(products)
})

app.post('/users', async (req, res) => {
    const { nome, email } = req.body || {}

    // validação simples
    if (!nome || typeof nome !== 'string') {
        return res.status(400).json({ erro: 'nome é obrigatório' })
    }
    if (!email || !email.includes('@')) {
        return res.status(400).json({ erro: 'email inválido' })
    }

    const users = await readUsers()
    const novoId = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1

    users.map(u => {
        if (u.email === email) {
            res.status(409).json({ erro: 'email Duplicado' })
        }
    })

    const novo = { id: novoId, nome, email }
    users.push(novo)
    await writeUsers(users)

    // 201 Created + recurso no body
    res.status(201).json(novo)
})

app.post('/users/batch', async (req, res) => {
    const novosUsuarios = req.body || []

    if (!Array.isArray(novosUsuarios)) {
        return res.status(400).json({ erro: 'esperado um array de usuários' })
    }

    for (const u of novosUsuarios) {
        if (!u.nome || typeof u.nome !== 'string') {
            return res.status(400).json({ erro: 'nome é obrigatório' })
        }
        if (!u.email || typeof u.email !== 'string' || !u.email.includes('@')) {
            return res.status(400).json({ erro: 'email inválido' })
        }
    }

    const usuariosExistentes = await readUsers()

    for (const u of novosUsuarios) {
        if (usuariosExistentes.some(e => e.email === u.email)) {
            return res.status(409).json({ erro: `email duplicado: ${u.email}` })
        }
    }

    let ultimoId = usuariosExistentes.length ? Math.max(...usuariosExistentes.map(u => u.id)) : 0
    const inseridos = novosUsuarios.map(u => {
        ultimoId++
        return { id: ultimoId, nome: u.nome, email: u.email }
    })

    usuariosExistentes.push(...inseridos)
    await writeUsers(usuariosExistentes)

    res.status(201).json(inseridos)
})


app.post('/products', async (req, res) => {
    const { nome, preco } = req.body || {}

    // validação simples
    if (!nome || typeof nome !== 'string') {
        return res.status(400).json({ erro: 'nome é obrigatório' })
    }
    if (!preco || typeof preco !== 'number') {
        return res.status(400).json({ erro: 'Preço inválido' })
    }

    const products = await readProducts()
    const novoId = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1

    const novo = { id: novoId, nome, preco }
    products.push(novo)
    await writeProducts(products)

    // 201 Created + recurso no body
    res.status(201).json(novo)
})