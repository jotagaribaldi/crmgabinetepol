"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const STATES = [
    { name: 'Acre', abbreviation: 'AC', ibgeCode: '12' },
    { name: 'Alagoas', abbreviation: 'AL', ibgeCode: '27' },
    { name: 'Amapá', abbreviation: 'AP', ibgeCode: '16' },
    { name: 'Amazonas', abbreviation: 'AM', ibgeCode: '13' },
    { name: 'Bahia', abbreviation: 'BA', ibgeCode: '29' },
    { name: 'Ceará', abbreviation: 'CE', ibgeCode: '23' },
    { name: 'Distrito Federal', abbreviation: 'DF', ibgeCode: '53' },
    { name: 'Espírito Santo', abbreviation: 'ES', ibgeCode: '32' },
    { name: 'Goiás', abbreviation: 'GO', ibgeCode: '52' },
    { name: 'Maranhão', abbreviation: 'MA', ibgeCode: '21' },
    { name: 'Mato Grosso', abbreviation: 'MT', ibgeCode: '51' },
    { name: 'Mato Grosso do Sul', abbreviation: 'MS', ibgeCode: '50' },
    { name: 'Minas Gerais', abbreviation: 'MG', ibgeCode: '31' },
    { name: 'Pará', abbreviation: 'PA', ibgeCode: '15' },
    { name: 'Paraíba', abbreviation: 'PB', ibgeCode: '25' },
    { name: 'Paraná', abbreviation: 'PR', ibgeCode: '41' },
    { name: 'Pernambuco', abbreviation: 'PE', ibgeCode: '26' },
    { name: 'Piauí', abbreviation: 'PI', ibgeCode: '22' },
    { name: 'Rio de Janeiro', abbreviation: 'RJ', ibgeCode: '33' },
    { name: 'Rio Grande do Norte', abbreviation: 'RN', ibgeCode: '24' },
    { name: 'Rio Grande do Sul', abbreviation: 'RS', ibgeCode: '43' },
    { name: 'Rondônia', abbreviation: 'RO', ibgeCode: '11' },
    { name: 'Roraima', abbreviation: 'RR', ibgeCode: '14' },
    { name: 'Santa Catarina', abbreviation: 'SC', ibgeCode: '42' },
    { name: 'São Paulo', abbreviation: 'SP', ibgeCode: '35' },
    { name: 'Sergipe', abbreviation: 'SE', ibgeCode: '28' },
    { name: 'Tocantins', abbreviation: 'TO', ibgeCode: '17' },
];
async function fetchMunicipalities() {
    console.log('🌐 Buscando municípios da API do IBGE...');
    const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome');
    if (!response.ok)
        throw new Error('Falha ao buscar municípios do IBGE');
    const data = (await response.json());
    return data;
}
function extractStateIbgeCode(m) {
    try {
        const code = m?.microrregiao?.mesorregiao?.UF?.id;
        if (code)
            return String(code);
    }
    catch { }
    try {
        const code = m?.['regiao-imediata']?.['regiao-intermediaria']?.UF?.id;
        if (code)
            return String(code);
    }
    catch { }
    const ibge = String(m.id);
    if (ibge.length >= 2) {
        return ibge.substring(0, 2);
    }
    return null;
}
async function main() {
    console.log('🌱 Iniciando seed do banco de dados...\n');
    console.log('📍 Inserindo estados...');
    for (const state of STATES) {
        await prisma.state.upsert({
            where: { ibgeCode: state.ibgeCode },
            update: { name: state.name, abbreviation: state.abbreviation },
            create: state,
        });
    }
    console.log(`✅ ${STATES.length} estados inseridos\n`);
    const ibgeMunicipalities = await fetchMunicipalities();
    console.log(`📍 Inserindo ${ibgeMunicipalities.length} municípios...\n`);
    const stateMap = new Map();
    const dbStates = await prisma.state.findMany({ select: { id: true, ibgeCode: true } });
    dbStates.forEach((s) => stateMap.set(s.ibgeCode, s.id));
    let inserted = 0;
    let errors = 0;
    const BATCH_SIZE = 100;
    for (let i = 0; i < ibgeMunicipalities.length; i += BATCH_SIZE) {
        const batch = ibgeMunicipalities.slice(i, i + BATCH_SIZE);
        const operations = batch.map((m) => {
            const stateIbgeCode = extractStateIbgeCode(m);
            const stateId = stateIbgeCode ? stateMap.get(stateIbgeCode) : undefined;
            if (!stateId) {
                errors++;
                return null;
            }
            return prisma.municipality.upsert({
                where: { ibgeCode: String(m.id) },
                update: { name: m.nome },
                create: {
                    ibgeCode: String(m.id),
                    name: m.nome,
                    stateId,
                },
            });
        });
        const validOps = operations.filter(Boolean);
        await Promise.all(validOps);
        inserted += validOps.length;
        const progress = Math.min(i + BATCH_SIZE, ibgeMunicipalities.length);
        process.stdout.write(`\r  Progresso: ${progress}/${ibgeMunicipalities.length} municípios...`);
    }
    console.log(`\n✅ ${inserted} municípios inseridos${errors > 0 ? ` | ⚠️  ${errors} erros` : ''}\n`);
    const bcrypt = await import('bcrypt');
    const rootPasswordHash = await bcrypt.hash('Admin@2026!', 12);
    const rootUser = await prisma.user.upsert({
        where: { email: 'root@crmpolitico.com.br' },
        update: {},
        create: {
            email: 'root@crmpolitico.com.br',
            name: 'Administrador Root',
            passwordHash: rootPasswordHash,
            role: 'ROOT',
            tenantId: null,
        },
    });
    console.log(`✅ Usuário ROOT criado: ${rootUser.email}`);
    console.log(`   Senha inicial: Admin@2026! (troque imediatamente)\n`);
    console.log('🎉 Seed concluído com sucesso!');
}
main()
    .catch((e) => {
    console.error('\n❌ Erro no seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map