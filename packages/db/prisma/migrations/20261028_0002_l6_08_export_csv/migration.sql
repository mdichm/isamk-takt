-- Migration L6-08: Ajout du format CSV à ExportFormat pour l'export des charges
ALTER TYPE "ExportFormat" ADD VALUE 'CSV';