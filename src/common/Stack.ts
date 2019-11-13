type HashedStack = {
    hashCode?: string
}

export default class Stack<T extends HashedStack> {
    protected elements: T[]

    constructor(protected size: number, protected useHash: boolean = true) {
        this.elements = []
    }

    compare(left: T, right: T): boolean {
        if (this.useHash) {
            return left.hashCode === right.hashCode
        }

        return left === right
    }

    add(element: T): void {
        this.elements.push(element)

        if (this.elements.length >= this.size) {
            // NOTE(jurrien) remove first item if new item is added, but length is exceeded
            this.elements.shift()
        }
    }

    remove(element: T | number): T | undefined {
        if (typeof element === 'number') {
            return this.elements.splice(element as number, 1).shift()
        }

        const index = this.indexOf(element)
        if (index !== - 1) {
            return this.remove(index)
        }
    }

    indexOf(element: T): number {
        for (let i = 0; i < this.elements.length; i ++) {
            if (this.compare(this.elements[i], element)) {
                return i
            }
        }

        return - 1
    }

    contains(element: T): boolean {
        return this.indexOf(element) > - 1
    }

    get(index: number): T | undefined {
        return this.elements[index] || undefined
    }

    get length(): number {
        return this.elements.length
    }

    get capacity(): number {
        return this.size
    }
}
