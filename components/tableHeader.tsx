import { Resizable } from "react-resizable";

export const TableHeader = (props) => {
    const { onResize, width, resizable, ...restProps } = props;

    if (!width || resizable === false) {
        return <th {...restProps} />;
    }

    return (
        <Resizable
            width={width}
            height={0}
            onResize={onResize}
            draggableOpts={{ enableUserSelectHack: true }}
            handle={
                <span
                    className="react-resizable-handle"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                />
            }>
            <th {...restProps} />
        </Resizable>
    );
};