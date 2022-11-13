// @flow
import type {
  Dependency as IDependency,
  Environment as IEnvironment,
  FilePath,
  Meta,
  MutableDependencySymbols as IMutableDependencySymbols,
  SourceLocation,
  SpecifierType,
  DependencyPriority,
  BundleBehavior,
} from '@parcel/types';
import type {Dependency as InternalDependency, ParcelOptions} from '../types';
import {BundleBehaviorNames} from '../types';

import nullthrows from 'nullthrows';
import Environment from './Environment';
import Target from './Target';
import {MutableDependencySymbols} from './Symbols';
import {SpecifierType as SpecifierTypeMap, Priority} from '../types';
import {fromProjectPath} from '../projectPath';
import {fromInternalSourceLocation} from '../utils';
import db from '@parcel/db';

const SpecifierTypeNames = Object.keys(SpecifierTypeMap);
const PriorityNames = Object.keys(Priority);

const inspect = Symbol.for('nodejs.util.inspect.custom');

const internalDependencyToDependency: Map<InternalDependency, Dependency> =
  new Map();
const _dependencyToInternalDependency: WeakMap<
  IDependency,
  InternalDependency,
> = new WeakMap();
export function dependencyToInternalDependency(
  dependency: IDependency,
): InternalDependency {
  return nullthrows(_dependencyToInternalDependency.get(dependency));
}

export default class Dependency implements IDependency {
  #dep /*: InternalDependency */;
  #options /*: ParcelOptions */;

  constructor(dep: InternalDependency, options: ParcelOptions): Dependency {
    let existing = internalDependencyToDependency.get(dep);
    if (existing != null) {
      return existing;
    }

    this.#dep = dep;
    this.#options = options;
    _dependencyToInternalDependency.set(this, dep);
    internalDependencyToDependency.set(dep, this);
    return this;
  }

  // $FlowFixMe
  [inspect](): string {
    return `Dependency(${String(this.sourcePath)} -> ${this.specifier})`;
  }

  get id(): string {
    return this.#dep;
  }

  get specifier(): string {
    return db.dependencySpecifier(this.#dep);
  }

  get specifierType(): SpecifierType {
    return SpecifierTypeNames[db.dependencySpecifierType(this.#dep)];
  }

  get priority(): DependencyPriority {
    return PriorityNames[db.dependencyPriority(this.#dep)];
  }

  get needsStableName(): boolean {
    return db.dependencyNeedsStableName(this.#dep);
  }

  get bundleBehavior(): ?BundleBehavior {
    let bundleBehavior = db.dependencyBundleBehavior(this.#dep);
    return bundleBehavior == 0 ? null : BundleBehaviorNames[bundleBehavior];
  }

  get isEntry(): boolean {
    return db.dependencyIsEntry(this.#dep);
  }

  get isOptional(): boolean {
    return db.dependencyIsOptional(this.#dep);
  }

  get loc(): ?SourceLocation {
    return fromInternalSourceLocation(this.#options.projectRoot, this.#dep.loc);
  }

  get env(): IEnvironment {
    return new Environment(db.dependencyEnv(this.#dep), this.#options);
  }

  get meta(): Meta {
    return this.#dep.meta ?? {};
  }

  get symbols(): IMutableDependencySymbols {
    return new MutableDependencySymbols(this.#options, this.#dep);
  }

  get target(): ?Target {
    // let target = this.#dep.target;
    let target = {
      distDir: db.fileId('dist'),
      env: db.dependencyEnv(this.#dep),
      name: 'test',
      publicUrl: '/',
    };
    return target ? new Target(target, this.#options) : null;
  }

  get sourceAssetId(): ?string {
    // TODO: does this need to be public?
    return this.#dep.sourceAssetId;
  }

  get sourcePath(): ?FilePath {
    // TODO: does this need to be public?
    return fromProjectPath(this.#options.projectRoot, this.#dep.sourcePath);
  }

  get sourceAssetType(): ?string {
    return this.#dep.sourceAssetType;
  }

  get resolveFrom(): ?string {
    return fromProjectPath(
      this.#options.projectRoot,
      db.dependencyResolveFrom(this.#dep) ?? this.#dep.sourcePath,
    );
  }

  get range(): ?string {
    return this.#dep.range;
  }

  get pipeline(): ?string {
    return this.#dep.pipeline;
  }
}
