/**
 * 抽象基础 Agent 类，所有具体 Agent 需继承本类
 * 使用范型保证输入输出类型安全，避免使用 any
 */
export abstract class BaseAgent<TInput = unknown, TOutput = unknown> {
  /** Agent 名称，用于日志与监控 */
  protected abstract readonly name: string

  /** 运行时上下文，可用于缓存数据或共享依赖 */
  protected readonly context: Record<string, unknown> = {}

  /** 初始化钩子：子类可重写，用于加载模型、配置、依赖等 */
  public async init(): Promise<void> {
    // 默认实现为空
  }

  /**
   * 主执行入口，子类必须实现
   * @param input 外部输入数据
   * @returns 输出结果
   */
  public abstract run(input: TInput): Promise<TOutput>

  /**
   * 向上下文注册依赖/能力
   * @param key 唯一键
   * @param ability 依赖实例
   */
  protected registerAbility(key: string, ability: unknown): void {
    this.context[key] = ability
  }

  /**
   * 获取已注册的依赖/能力
   * @param key 唯一键
   * @returns 依赖实例或 undefined
   */
  protected getAbility<U>(key: string): U | undefined {
    return this.context[key] as U | undefined
  }

  /**
   * 统一日志输出，后续可替换为更专业的日志库
   * @param message 日志内容
   */
  protected log(message: string): void {
    // eslint-disable-next-line no-console
    console.log(`[${this.name}] ${message}`)
  }

  /**
   * 统一错误处理，可在此处接入监控系统
   * @param err 捕获的异常
   */
  protected handleError(err: unknown): never {
    // eslint-disable-next-line no-console
    console.error(`[${this.name}]`, err)
    throw err
  }
}
