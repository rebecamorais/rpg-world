// app/api/characters/[id]/route.ts
import { CharacterController } from '@/backend/contexts/characters/interfaces/character.controller';

// BUSCAR UM PERSONAGEM
export async function GET(req: Request, { params }: { params: { id: string } }) {
    return CharacterController.getById(params.id);
}

// // ATUALIZAR UM PERSONAGEM (Atributos, HP, XP, etc)
// export async function PUT(req: Request, { params }: { params: { id: string } }) {
//     const body = await req.json();
//     return CharacterController.update(params.id, body);
// }

// // EXCLUIR UM PERSONAGEM
// export async function DELETE(req: Request, { params }: { params: { id: string } }) {
//     return CharacterController.delete(params.id);
// }