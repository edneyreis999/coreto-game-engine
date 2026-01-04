# Task Completion Checklist

## When a Development Task is Completed

This checklist should be followed EVERY TIME you complete a task, feature, or fix.

### 1. Code Quality Checks

#### Type Checking

```bash
npm run type-check
# Ensure no TypeScript errors
```

#### Linting

```bash
npm run lint
# Fix any linting issues
npm run lint:fix
```

#### Formatting

```bash
npm run format
# Ensure code is properly formatted
```

### 2. Testing Requirements

#### Unit Tests

- [ ] All affected unit tests pass
- [ ] New unit tests added for new functionality
- [ ] Edge cases covered
- [ ] Mock dependencies properly

```bash
npm test
```

#### Integration Tests (when applicable)

- [ ] Integration tests pass
- [ ] Tests cover happy path
- [ ] Tests cover error scenarios

```bash
npm run test:integration
```

#### Coverage Requirements

- [ ] Maintain or improve test coverage
- [ ] Critical paths have >80% coverage

```bash
npm run test:coverage
```

### 3. Documentation Updates

#### Code Documentation

- [ ] JSDoc comments for public APIs
- [ ] Inline comments for complex logic (explain WHY, not WHAT)
- [ ] Type annotations complete and accurate

#### External Documentation

When architectural changes are made:

- [ ] Update relevant ADRs if decision changes
- [ ] Create new ADR for new architectural decisions
- [ ] Update HLD if high-level design changes
- [ ] Update PRD if requirements change (rare)

#### README Updates

- [ ] Update README.md if CLI commands change
- [ ] Update usage examples if API changes
- [ ] Update installation instructions if dependencies change

### 4. Security Review (ADR-001)

#### Read-Only Enforcement

- [ ] NO writes to RPG Maker MZ project (`projectPath/data/`)
- [ ] Only writes to `report/` directory
- [ ] Path validation prevents traversal attacks

#### Input Validation

- [ ] All user inputs validated with Zod schemas
- [ ] IDs checked against database (troopId, enemyId, skillId, classId)
- [ ] Numeric ranges validated (levels 1-99, positive seeds)

### 5. Error Handling

#### Warnings System (ADR-013)

- [ ] Errors don't crash execution (collect warnings instead)
- [ ] Warnings have correct severity (critical, warning, info)
- [ ] Warning context includes all relevant data
- [ ] Warnings appear in report.json

#### Fail-Fast Validation

- [ ] Configuration errors detected early
- [ ] Invalid project structure fails immediately
- [ ] Clear error messages for users

### 6. Performance Checks

#### Execution Time

- [ ] No significant performance regression
- [ ] Profiling done if new bottleneck suspected
- [ ] Cache strategy considered for repeated operations

#### Memory Usage

- [ ] No memory leaks in simulation loop
- [ ] Large objects cleaned up after use
- [ ] Memory profiling done if concerned

### 7. Git Workflow

#### Before Commit

- [ ] All tests pass: `npm test`
- [ ] Linting passes: `npm run lint`
- [ ] Type checking passes: `npm run type-check`
- [ ] No debug code (console.log, debugger) left in production code

#### Commit Message

```bash
# Use Conventional Commits format
git commit -m "feat(simulation): implement skill selection by damage-per-action"
git commit -m "fix(loader): handle missing troopId gracefully"
git commit -m "docs(adr): add ADR-029 for parallel execution strategy"
```

#### After Commit

- [ ] Push to remote: `git push origin <branch>`
- [ ] Create PR if working on feature branch
- [ ] Link PR to relevant issue/task

### 8. Integration Checks

#### Dependencies

- [ ] No new dependencies added without justification
- [ ] Security audit clean: `npm audit`
- [ ] Licenses compatible with project

#### Backward Compatibility

- [ ] Changes don't break existing configs (or migration provided)
- [ ] Report format changes versioned
- [ ] CLI flags remain compatible

### 9. Observability (HLD Section 9)

#### Logging

- [ ] Appropriate log levels used (ERROR, WARN, INFO, DEBUG)
- [ ] Structured logging format followed
- [ ] No sensitive data in logs

#### Metrics

- [ ] Execution time tracked if relevant
- [ ] Key metrics added to report.json
- [ ] Aggregates calculated correctly (mean, p95)

### 10. Final Validation

Before marking task as DONE:

- [ ] Feature meets acceptance criteria from PRD
- [ ] All checklist items above completed
- [ ] Code reviewed (self-review or peer review)
- [ ] No known bugs or issues
- [ ] Ready for production use (or clearly marked as WIP)

## Special Cases

### New Architecture Decision

When making architectural decision:

1. Document in new ADR following MADR format
2. Include all 7 required sections
3. Add to docs/adrs/<MODULE>/ADR-XXX-<title>.md
4. Update docs/adrs/INDEX.md
5. Update docs/adrs/README.md

### Breaking Changes

If change breaks existing functionality:

1. Document in CHANGELOG (when created)
2. Provide migration guide
3. Update version number (SemVer)
4. Notify team/stakeholders

### Hotfixes

For critical production fixes:

1. Create hotfix branch from main
2. Minimal changes only
3. Fast-track testing
4. Deploy immediately after validation
5. Document in post-mortem

## References

- ADR-001: Read-Only Wrapper
- ADR-008: Zod Schema Validation
- ADR-013: Typed Warning System
- ADR-028: TypeScript Standards
- HLD Section 8: Security
- HLD Section 9: Observability
