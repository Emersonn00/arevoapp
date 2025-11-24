export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      arena_affiliations: {
        Row: {
          arena_id: string
          created_at: string
          id: string
          referral_code: string
          updated_at: string
          user_id: string
        }
        Insert: {
          arena_id: string
          created_at?: string
          id?: string
          referral_code: string
          updated_at?: string
          user_id: string
        }
        Update: {
          arena_id?: string
          created_at?: string
          id?: string
          referral_code?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      arena_collaborators: {
        Row: {
          accepted_at: string | null
          arena_id: string
          created_at: string
          id: string
          invited_at: string
          invited_by: string
          permissions: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          arena_id: string
          created_at?: string
          id?: string
          invited_at?: string
          invited_by: string
          permissions?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          arena_id?: string
          created_at?: string
          id?: string
          invited_at?: string
          invited_by?: string
          permissions?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "arena_collaborators_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
        ]
      }
      arena_vouchers: {
        Row: {
          arena_id: string
          created_at: string
          id: string
          updated_at: string
          voucher_code: string
        }
        Insert: {
          arena_id: string
          created_at?: string
          id?: string
          updated_at?: string
          voucher_code: string
        }
        Update: {
          arena_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          voucher_code?: string
        }
        Relationships: []
      }
      arenas: {
        Row: {
          ativo: boolean | null
          created_at: string
          descricao: string | null
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_complemento: string | null
          endereco_numero: string | null
          endereco_rua: string | null
          foto_url: string | null
          fotos: Json | null
          horario_funcionamento: Json | null
          id: string
          instagram: string | null
          nome: string
          quadras: Json | null
          referral_code: string | null
          telefone: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          descricao?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_numero?: string | null
          endereco_rua?: string | null
          foto_url?: string | null
          fotos?: Json | null
          horario_funcionamento?: Json | null
          id?: string
          instagram?: string | null
          nome: string
          quadras?: Json | null
          referral_code?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          descricao?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_numero?: string | null
          endereco_rua?: string | null
          foto_url?: string | null
          fotos?: Json | null
          horario_funcionamento?: Json | null
          id?: string
          instagram?: string | null
          nome?: string
          quadras?: Json | null
          referral_code?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      aulas: {
        Row: {
          aceita_totalpass: boolean | null
          aceita_wellhub: boolean | null
          arena_id: string
          ativo: boolean | null
          created_at: string
          data: string
          descricao: string | null
          dias_semana: string[] | null
          duracao: number
          horario: string
          id: string
          is_recorrente: boolean | null
          max_alunos: number | null
          nivel: string | null
          preco: number | null
          professor_id: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          aceita_totalpass?: boolean | null
          aceita_wellhub?: boolean | null
          arena_id: string
          ativo?: boolean | null
          created_at?: string
          data: string
          descricao?: string | null
          dias_semana?: string[] | null
          duracao?: number
          horario: string
          id?: string
          is_recorrente?: boolean | null
          max_alunos?: number | null
          nivel?: string | null
          preco?: number | null
          professor_id: string
          tipo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          aceita_totalpass?: boolean | null
          aceita_wellhub?: boolean | null
          arena_id?: string
          ativo?: boolean | null
          created_at?: string
          data?: string
          descricao?: string | null
          dias_semana?: string[] | null
          duracao?: number
          horario?: string
          id?: string
          is_recorrente?: boolean | null
          max_alunos?: number | null
          nivel?: string | null
          preco?: number | null
          professor_id?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_aulas_arena_id"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
        ]
      }
      campeonatos: {
        Row: {
          arena_id: string | null
          ativo: boolean | null
          cidade: string
          created_at: string
          data_fim: string
          data_fim_inscricoes: string
          data_fim_pagamento: string
          data_inicio: string
          data_inicio_inscricoes: string
          data_inicio_pagamento: string
          estado: string
          foto_capa_url: string | null
          id: string
          inscricoes_abertas: boolean
          local_arena: string
          max_equipes: number | null
          nome: string
          organizador: string
          regras: string | null
          taxa_inscricao: number | null
          telefone_contato: string
          tipo_campeonato: string
          updated_at: string
          user_id: string
        }
        Insert: {
          arena_id?: string | null
          ativo?: boolean | null
          cidade: string
          created_at?: string
          data_fim: string
          data_fim_inscricoes: string
          data_fim_pagamento: string
          data_inicio: string
          data_inicio_inscricoes: string
          data_inicio_pagamento: string
          estado: string
          foto_capa_url?: string | null
          id?: string
          inscricoes_abertas?: boolean
          local_arena: string
          max_equipes?: number | null
          nome: string
          organizador: string
          regras?: string | null
          taxa_inscricao?: number | null
          telefone_contato: string
          tipo_campeonato?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          arena_id?: string | null
          ativo?: boolean | null
          cidade?: string
          created_at?: string
          data_fim?: string
          data_fim_inscricoes?: string
          data_fim_pagamento?: string
          data_inicio?: string
          data_inicio_inscricoes?: string
          data_inicio_pagamento?: string
          estado?: string
          foto_capa_url?: string | null
          id?: string
          inscricoes_abertas?: boolean
          local_arena?: string
          max_equipes?: number | null
          nome?: string
          organizador?: string
          regras?: string | null
          taxa_inscricao?: number | null
          telefone_contato?: string
          tipo_campeonato?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campeonatos_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_campeonatos: {
        Row: {
          campeonato_id: string
          categoria: string
          created_at: string
          id: string
          limite_duplas: number
          nivel: string
          nome_categoria: string
          updated_at: string
        }
        Insert: {
          campeonato_id: string
          categoria: string
          created_at?: string
          id?: string
          limite_duplas: number
          nivel: string
          nome_categoria: string
          updated_at?: string
        }
        Update: {
          campeonato_id?: string
          categoria?: string
          created_at?: string
          id?: string
          limite_duplas?: number
          nivel?: string
          nome_categoria?: string
          updated_at?: string
        }
        Relationships: []
      }
      class_approvals: {
        Row: {
          arena_id: string
          arena_owner_id: string
          class_id: string
          created_at: string
          id: string
          professor_id: string
          responded_at: string | null
          status: string
        }
        Insert: {
          arena_id: string
          arena_owner_id: string
          class_id: string
          created_at?: string
          id?: string
          professor_id: string
          responded_at?: string | null
          status?: string
        }
        Update: {
          arena_id?: string
          arena_owner_id?: string
          class_id?: string
          created_at?: string
          id?: string
          professor_id?: string
          responded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_approvals_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_approvals_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: true
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          is_group: boolean
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_group?: boolean
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_group?: boolean
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      experimental_voucher_usages: {
        Row: {
          arena_id: string
          aula_id: string
          created_at: string
          data_aula: string
          id: string
          user_id: string
          voucher_code: string
        }
        Insert: {
          arena_id: string
          aula_id: string
          created_at?: string
          data_aula: string
          id?: string
          user_id: string
          voucher_code: string
        }
        Update: {
          arena_id?: string
          aula_id?: string
          created_at?: string
          data_aula?: string
          id?: string
          user_id?: string
          voucher_code?: string
        }
        Relationships: []
      }
      faltas_aulas: {
        Row: {
          arena_id: string
          aula_id: string
          created_at: string
          data_aula: string
          id: string
          marcado_por: string
          motivo: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          arena_id: string
          aula_id: string
          created_at?: string
          data_aula: string
          id?: string
          marcado_por: string
          motivo?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          arena_id?: string
          aula_id?: string
          created_at?: string
          data_aula?: string
          id?: string
          marcado_por?: string
          motivo?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_faltas_aulas_arena_id"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faltas_aulas_aula_id"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      inscricoes_aulas: {
        Row: {
          aplicativo_bem_estar: string | null
          aula_id: string
          created_at: string
          data_aula: string
          data_inscricao: string
          id: string
          nome_aluno: string
          telefone_aluno: string
          updated_at: string
          user_id: string
        }
        Insert: {
          aplicativo_bem_estar?: string | null
          aula_id: string
          created_at?: string
          data_aula?: string
          data_inscricao?: string
          id?: string
          nome_aluno: string
          telefone_aluno: string
          updated_at?: string
          user_id: string
        }
        Update: {
          aplicativo_bem_estar?: string | null
          aula_id?: string
          created_at?: string
          data_aula?: string
          data_inscricao?: string
          id?: string
          nome_aluno?: string
          telefone_aluno?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscricoes_aulas_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      inscricoes_campeonatos: {
        Row: {
          campeonato_id: string
          categoria_id: string
          competidor1_id: string
          competidor2_id: string
          created_at: string
          id: string
          inscrito_por_id: string
          pagamento_confirmado: boolean
          status: string
          status_inscricao: string
          status_pagamento: string | null
          updated_at: string
        }
        Insert: {
          campeonato_id: string
          categoria_id: string
          competidor1_id: string
          competidor2_id: string
          created_at?: string
          id?: string
          inscrito_por_id: string
          pagamento_confirmado?: boolean
          status?: string
          status_inscricao?: string
          status_pagamento?: string | null
          updated_at?: string
        }
        Update: {
          campeonato_id?: string
          categoria_id?: string
          competidor1_id?: string
          competidor2_id?: string
          created_at?: string
          id?: string
          inscrito_por_id?: string
          pagamento_confirmado?: boolean
          status?: string
          status_inscricao?: string
          status_pagamento?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_campeonato"
            columns: ["campeonato_id"]
            isOneToOne: false
            referencedRelation: "campeonatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_categoria"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_campeonatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_competidor1"
            columns: ["competidor1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_competidor2"
            columns: ["competidor2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      listas_espera_aulas: {
        Row: {
          aula_id: string
          created_at: string
          data_aula: string
          id: string
          nome_aluno: string
          notified_at: string | null
          telefone_aluno: string
          updated_at: string
          user_id: string
        }
        Insert: {
          aula_id: string
          created_at?: string
          data_aula: string
          id?: string
          nome_aluno: string
          notified_at?: string | null
          telefone_aluno: string
          updated_at?: string
          user_id: string
        }
        Update: {
          aula_id?: string
          created_at?: string
          data_aula?: string
          id?: string
          nome_aluno?: string
          notified_at?: string | null
          telefone_aluno?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listas_espera_aulas_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          image_url: string | null
          is_deleted: boolean
          reply_to_id: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_deleted?: boolean
          reply_to_id?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_deleted?: boolean
          reply_to_id?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      nivel_alunos_arena: {
        Row: {
          aluno_id: string
          arena_id: string
          ativo: boolean
          created_at: string
          data_atribuicao: string
          id: string
          limite_agendamentos_semanal: number | null
          nivel: string
          professor_id: string
          updated_at: string
        }
        Insert: {
          aluno_id: string
          arena_id: string
          ativo?: boolean
          created_at?: string
          data_atribuicao?: string
          id?: string
          limite_agendamentos_semanal?: number | null
          nivel: string
          professor_id: string
          updated_at?: string
        }
        Update: {
          aluno_id?: string
          arena_id?: string
          ativo?: boolean
          created_at?: string
          data_atribuicao?: string
          id?: string
          limite_agendamentos_semanal?: number | null
          nivel?: string
          professor_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read_at: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read_at?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_pinned: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          apelido_camisa: string | null
          aplicativo_bem_estar: string | null
          atividades: number | null
          avatar_url: string | null
          bio: string | null
          cidade: string | null
          consents_version: string
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          estado: string | null
          genero: string | null
          id: string
          image_consent_accepted: boolean
          image_consent_accepted_at: string | null
          nivel_jogabilidade: string | null
          nome: string | null
          nome_completo: string | null
          plano: Database["public"]["Enums"]["plano_tipo"]
          privacy_accepted: boolean
          privacy_accepted_at: string | null
          seguidores: number | null
          seguindo: number | null
          tamanho_camisa: string | null
          telefone: string | null
          terms_accepted: boolean
          terms_accepted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          apelido_camisa?: string | null
          aplicativo_bem_estar?: string | null
          atividades?: number | null
          avatar_url?: string | null
          bio?: string | null
          cidade?: string | null
          consents_version?: string
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          estado?: string | null
          genero?: string | null
          id?: string
          image_consent_accepted?: boolean
          image_consent_accepted_at?: string | null
          nivel_jogabilidade?: string | null
          nome?: string | null
          nome_completo?: string | null
          plano?: Database["public"]["Enums"]["plano_tipo"]
          privacy_accepted?: boolean
          privacy_accepted_at?: string | null
          seguidores?: number | null
          seguindo?: number | null
          tamanho_camisa?: string | null
          telefone?: string | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          apelido_camisa?: string | null
          aplicativo_bem_estar?: string | null
          atividades?: number | null
          avatar_url?: string | null
          bio?: string | null
          cidade?: string | null
          consents_version?: string
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          estado?: string | null
          genero?: string | null
          id?: string
          image_consent_accepted?: boolean
          image_consent_accepted_at?: string | null
          nivel_jogabilidade?: string | null
          nome?: string | null
          nome_completo?: string | null
          plano?: Database["public"]["Enums"]["plano_tipo"]
          privacy_accepted?: boolean
          privacy_accepted_at?: string | null
          seguidores?: number | null
          seguindo?: number | null
          tamanho_camisa?: string | null
          telefone?: string | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          conversation_id: string | null
          created_at: string
          details: string | null
          id: string
          message_id: string | null
          reason: string
          reported_user_id: string
          reporter_id: string
          status: string
          updated_at: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          message_id?: string | null
          reason: string
          reported_user_id: string
          reporter_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          message_id?: string | null
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_collaborators: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          invited_at: string
          invited_by: string
          permissions: Json | null
          status: string
          tournament_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string
          invited_by: string
          permissions?: Json | null
          status?: string
          tournament_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string
          invited_by?: string
          permissions?: Json | null
          status?: string
          tournament_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_collaborators_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "campeonatos"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_matches: {
        Row: {
          bracket: string
          categoria_id: string
          court: string | null
          created_at: string
          game_order: number | null
          global_match_number: number | null
          id: string
          match_number: number
          next_match_loser_id: string | null
          next_match_winner_id: string | null
          round: number
          scheduled_time: string | null
          source_match_loser_id: string | null
          source_match_winner_id: string | null
          status: string
          team1_inscription_id: string | null
          team1_score: number | null
          team2_inscription_id: string | null
          team2_score: number | null
          tournament_id: string
          updated_at: string
          winner_inscription_id: string | null
        }
        Insert: {
          bracket?: string
          categoria_id: string
          court?: string | null
          created_at?: string
          game_order?: number | null
          global_match_number?: number | null
          id?: string
          match_number: number
          next_match_loser_id?: string | null
          next_match_winner_id?: string | null
          round?: number
          scheduled_time?: string | null
          source_match_loser_id?: string | null
          source_match_winner_id?: string | null
          status?: string
          team1_inscription_id?: string | null
          team1_score?: number | null
          team2_inscription_id?: string | null
          team2_score?: number | null
          tournament_id: string
          updated_at?: string
          winner_inscription_id?: string | null
        }
        Update: {
          bracket?: string
          categoria_id?: string
          court?: string | null
          created_at?: string
          game_order?: number | null
          global_match_number?: number | null
          id?: string
          match_number?: number
          next_match_loser_id?: string | null
          next_match_winner_id?: string | null
          round?: number
          scheduled_time?: string | null
          source_match_loser_id?: string | null
          source_match_winner_id?: string | null
          status?: string
          team1_inscription_id?: string | null
          team1_score?: number | null
          team2_inscription_id?: string | null
          team2_score?: number | null
          tournament_id?: string
          updated_at?: string
          winner_inscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_next_match_loser"
            columns: ["next_match_loser_id"]
            isOneToOne: false
            referencedRelation: "tournament_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_next_match_winner"
            columns: ["next_match_winner_id"]
            isOneToOne: false
            referencedRelation: "tournament_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_source_match_loser"
            columns: ["source_match_loser_id"]
            isOneToOne: false
            referencedRelation: "tournament_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_source_match_winner"
            columns: ["source_match_winner_id"]
            isOneToOne: false
            referencedRelation: "tournament_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activities_comments: {
        Row: {
          activity_id: string
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_id: string
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_activities_likes: {
        Row: {
          activity_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_class_approval: {
        Args: { p_notification_id: string }
        Returns: Json
      }
      accept_collaboration_invite: {
        Args: { p_notification_id: string }
        Returns: Json
      }
      accept_tournament_collaboration_invite: {
        Args: { p_notification_id: string }
        Returns: Json
      }
      accept_tournament_invite: {
        Args: { p_notification_id: string }
        Returns: Json
      }
      advance_match_loser: {
        Args: { loser_id: string; match_id: string }
        Returns: undefined
      }
      advance_match_winner: {
        Args: { match_id: string; winner_id: string }
        Returns: undefined
      }
      apply_match_result: {
        Args: {
          p_match_id: string
          p_team1_score: number
          p_team2_score: number
          p_winner_inscription_id: string
        }
        Returns: undefined
      }
      calculate_next_class_date: {
        Args: {
          class_date: string
          class_time: string
          is_recurring?: boolean
          week_days?: string[]
        }
        Returns: string
      }
      can_student_enroll_in_class: {
        Args: { p_aluno_id: string; p_aula_id: string }
        Returns: boolean
      }
      check_same_arena_enrollment: {
        Args: {
          p_arena_id: string
          p_data_aula: string
          p_exclude_aula_id?: string
          p_user_id: string
        }
        Returns: {
          existing_class_time: string
          existing_class_title: string
          has_enrollment: boolean
        }[]
      }
      check_weekly_enrollment_limit: {
        Args: { p_aula_id: string; p_data_aula: string; p_user_id: string }
        Returns: {
          can_enroll: boolean
          current_count: number
          has_limit: boolean
          limit_value: number
        }[]
      }
      create_12_team_bracket: {
        Args: {
          p_categoria_id: string
          p_teams: string[]
          p_tournament_id: string
        }
        Returns: Json
      }
      create_class_approval_notification: {
        Args: {
          p_arena_id: string
          p_arena_owner_id: string
          p_class_id: string
          p_professor_id: string
        }
        Returns: undefined
      }
      create_collaboration_invite_notification: {
        Args: {
          p_arena_id: string
          p_invited_by: string
          p_invited_user_id: string
        }
        Returns: undefined
      }
      create_double_elimination_bracket:
        | {
            Args: { p_categoria_id: string; p_tournament_id: string }
            Returns: Json
          }
        | {
            Args: {
              p_categoria_id: string
              p_teams: string[]
              p_tournament_id: string
            }
            Returns: Json
          }
      create_group_conversation: {
        Args: { p_group_name: string; p_participants: string[] }
        Returns: string
      }
      create_tournament_collaboration_invite_notification: {
        Args: {
          p_invited_by: string
          p_invited_user_id: string
          p_tournament_id: string
        }
        Returns: undefined
      }
      debug_auth_context: { Args: never; Returns: Json }
      get_arena_ban_status: {
        Args: { target_arena_id: string }
        Returns: {
          ban_end: string
          banned: boolean
          faltas_mes: number
        }[]
      }
      get_capacity_for_classes: {
        Args: { class_ids: string[]; target_date?: string }
        Returns: {
          aula_id: string
          current_inscricoes: number
          is_full: boolean
          max_alunos: number
          vagas_disponiveis: number
          waitlist_count: number
        }[]
      }
      get_inscricoes_aulas_with_profile: {
        Args: { aula_id_param: string; data_aula_param?: string }
        Returns: {
          aplicativo_bem_estar: string
          aula_id: string
          data_aula: string
          data_inscricao: string
          id: string
          is_experimental: boolean
          nome_aluno: string
          telefone_aluno: string
          user_id: string
        }[]
      }
      get_or_create_conversation: {
        Args: { other_user_id: string }
        Returns: string
      }
      get_public_profile: {
        Args: { target_user_id: string }
        Returns: {
          avatar_url: string
          bio: string
          cidade: string
          nivel_jogabilidade: string
          nome: string
          user_id: string
        }[]
      }
      get_public_profiles: {
        Args: never
        Returns: {
          avatar_url: string
          bio: string
          cidade: string
          nivel_jogabilidade: string
          nome: string
          user_id: string
        }[]
      }
      get_safe_public_profile: {
        Args: { target_user_id: string }
        Returns: {
          avatar_url: string
          bio: string
          cidade: string
          nivel_jogabilidade: string
          nome: string
          user_id: string
        }[]
      }
      get_student_level_for_arena: {
        Args: { p_aluno_id: string; p_arena_id: string }
        Returns: string
      }
      get_tournament_competitor_info: {
        Args: { target_user_id: string; tournament_id: string }
        Returns: {
          avatar_url: string
          bio: string
          cidade: string
          estado: string
          nivel_jogabilidade: string
          nome: string
          nome_completo: string
          tamanho_camisa: string
          telefone: string
          user_id: string
        }[]
      }
      get_tournament_inscription_count: {
        Args: { tournament_id: string }
        Returns: {
          campeonato_id: string
          categoria_id: string
          total_inscricoes: number
        }[]
      }
      get_tournament_match_teams: {
        Args: { p_match_id: string }
        Returns: {
          match_id: string
          team1_competidor1_cidade: string
          team1_competidor1_nome: string
          team1_competidor2_cidade: string
          team1_competidor2_nome: string
          team2_competidor1_cidade: string
          team2_competidor1_nome: string
          team2_competidor2_cidade: string
          team2_competidor2_nome: string
        }[]
      }
      get_tournament_matches_with_teams: {
        Args: { p_tournament_id: string }
        Returns: {
          bracket: string
          categoria_id: string
          court: string
          game_order: number
          id: string
          match_number: number
          next_match_loser_id: string
          next_match_winner_id: string
          round: number
          scheduled_time: string
          status: string
          team1_competidor1_cidade: string
          team1_competidor1_nome: string
          team1_competidor2_cidade: string
          team1_competidor2_nome: string
          team1_inscription_id: string
          team1_score: number
          team2_competidor1_cidade: string
          team2_competidor1_nome: string
          team2_competidor2_cidade: string
          team2_competidor2_nome: string
          team2_inscription_id: string
          team2_score: number
          tournament_id: string
          winner_inscription_id: string
        }[]
      }
      get_tournament_participants: {
        Args: { tournament_id: string }
        Returns: {
          categoria_id: string
          competidor1_avatar: string
          competidor1_cidade: string
          competidor1_nome: string
          competidor2_avatar: string
          competidor2_cidade: string
          competidor2_nome: string
          inscricao_id: string
        }[]
      }
      handle_mark_absence: {
        Args: {
          p_arena_id: string
          p_aula_id: string
          p_data_aula: string
          p_marcado_por: string
          p_user_id: string
        }
        Returns: undefined
      }
      has_experimental_voucher: {
        Args: { target_arena_id: string }
        Returns: boolean
      }
      is_arena_collaborator: {
        Args: { arena_uuid: string; user_uuid: string }
        Returns: boolean
      }
      is_arena_owner: {
        Args: { arena_uuid: string; user_uuid: string }
        Returns: boolean
      }
      is_class_for_own_arena: {
        Args: { p_arena_id: string; p_professor_id: string }
        Returns: boolean
      }
      is_conversation_participant: {
        Args: { conversation_uuid: string; user_uuid: string }
        Returns: boolean
      }
      is_eligible_for_closed_tournament: {
        Args: { p_tournament_id: string; p_user_id: string }
        Returns: boolean
      }
      is_following: {
        Args: { follower_uuid: string; following_uuid: string }
        Returns: boolean
      }
      is_profile_complete: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      is_tournament_collaborator: {
        Args: { tournament_uuid: string; user_uuid: string }
        Returns: boolean
      }
      is_user_banned_for_arena: {
        Args: { target_arena_id: string; target_user_id: string }
        Returns: boolean
      }
      perform_tournament_draw: {
        Args: { p_categoria_id: string; p_tournament_id: string }
        Returns: Json
      }
      perform_tournament_draw_complete: {
        Args: { p_categoria_id: string; p_tournament_id: string }
        Returns: Json
      }
      reject_class_approval: {
        Args: { p_notification_id: string }
        Returns: Json
      }
      reject_collaboration_invite: {
        Args: { p_notification_id: string }
        Returns: Json
      }
      reject_tournament_collaboration_invite: {
        Args: { p_notification_id: string }
        Returns: Json
      }
      reject_tournament_invite: {
        Args: { p_notification_id: string }
        Returns: Json
      }
      setup_bracket_connections: {
        Args: { p_categoria_id: string; p_tournament_id: string }
        Returns: undefined
      }
      subscribe_experimental: {
        Args: { p_aula_id: string; p_data_aula: string; p_voucher: string }
        Returns: Json
      }
      update_conversation_name: {
        Args: { p_conversation_id: string; p_new_name: string }
        Returns: Json
      }
    }
    Enums: {
      plano_tipo: "gratuito" | "coach" | "arena"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      plano_tipo: ["gratuito", "coach", "arena"],
    },
  },
} as const
