# Project Overview: coreto game engine

## Purpose

Sistema de validação determinística de TTK (Time-to-Kill) para balanceamento de combate em RPGs desenvolvidos no RPG Maker MZ.

## Core Functionality

- **Wrapper Read-Only**: Opera sobre projetos RPG Maker MZ sem modificar arquivos do projeto (ADR-001)
- **Headless Battle Execution**: Executa batalhas reais via engine RPG Maker MZ em ambiente headless (JSDOM)
- **TTK Measurement**: Mede Time-to-Kill em turnos e ações para validar balanceamento
- **Deterministic Simulation**: Usa seed fixa para garantir reprodutibilidade (ADR-018)
- **Report Generation**: Gera relatórios detalhados em JSON com resultados, warnings e agregados
- **AI Context Export**: Divide JSONs grandes do RPG Maker MZ em arquivos menores para uso com IA

## Target Users

- Game designers da Coreto
- Designers de combate e balanceamento

## Key Objectives

- Reduzir ciclo de validação de balanceamento de **2-3 dias** para **≤10 minutos**
- Executar batalhas reais (não simulação matemática) para alta fidelidade ao jogo final
- Suportar plugins VisuStella em ambiente headless
- Gerar relatórios estruturados com warnings e métricas agregadas

## Current Status

**PRE-IMPLEMENTATION PHASE**

- Documentação completa (PRD, HLD, 28 ADRs)
- Nenhum código implementado ainda
- Projeto em fase de design e planejamento arquitetural

## Project Phase

MVP v1 (read-only, CLI-only, no UI, no CI)
