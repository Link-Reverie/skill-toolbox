import { capitalize } from '@workspace/utils';

/**
 * Basic UI components
 */

export interface ButtonProps {
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export interface InputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export class Component {
  protected element: HTMLElement | null = null;

  public render(): HTMLElement {
    if (!this.element) {
      this.element = document.createElement('div');
    }
    return this.element;
  }

  public destroy(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}

export class Button extends Component {
  private props: ButtonProps;

  constructor(props: ButtonProps) {
    super();
    this.props = props;
  }

  public override render(): HTMLElement {
    const button = document.createElement('button');
    button.textContent = capitalize(this.props.label);
    button.className = `btn btn-${this.props.variant || 'primary'}`;
    if (this.props.onClick) {
      button.addEventListener('click', this.props.onClick);
    }
    return button;
  }
}
