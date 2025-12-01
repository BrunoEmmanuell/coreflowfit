import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Dumbbell, LogOut, Plus, User } from 'lucide-react';

interface Aluno {
  id: string;
  nome: string;
  objetivo?: string;
  nivel?: string;
  peso?: number;
  altura?: number;
}

export default function Dashboard() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    loadAlunos();
  }, []);

  const loadAlunos = async () => {
    try {
      const response = await api.get('/api/v1/alunos/');
      setAlunos(response.data);
    } catch (error: any) {
      toast.error('Erro ao carregar alunos');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">CoreFlowFit</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Meus Alunos</h2>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Aluno
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Carregando alunos...</p>
          </div>
        ) : alunos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum aluno cadastrado
              </h3>
              <p className="text-gray-500 mb-4">
                Comece adicionando seu primeiro aluno
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Aluno
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alunos.map((aluno) => (
              <Card key={aluno.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{aluno.nome}</CardTitle>
                        {aluno.objetivo && (
                          <p className="text-sm text-gray-500">{aluno.objetivo}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {aluno.nivel && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Nível:</span>
                        <span className="font-medium">{aluno.nivel}</span>
                      </div>
                    )}
                    {aluno.peso && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Peso:</span>
                        <span className="font-medium">{aluno.peso} kg</span>
                      </div>
                    )}
                    {aluno.altura && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Altura:</span>
                        <span className="font-medium">{aluno.altura} cm</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Ver Perfil
                    </Button>
                    <Button size="sm" className="flex-1">
                      Gerar Treino
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
