(() => {
    const img = new Image();
    img.src = "https://i.ibb.co/4ZXpyRq5/blue.png";

    const ColorGroups = function(npc) {
        this.rx = npc.rx;
        this.ry = npc.ry;

        this.draw = (ctx) => {
            const shift = Engine.mapShift.getShift();
            const offsetX = this.offsetX ?? 0;
            const offsetY = this.offsetY ?? 0;
            const leftMod = this.leftPosMod ?? 0;

            const n = 32 * this.rx + 16 - img.width / 2 - 2 + offsetX - Engine.map.offset[0] - shift[0] + leftMod;
            const a = 32 * this.ry - img.height + 32 + offsetY - Engine.map.offset[1] - shift[1];

            ctx.drawImage(img, n, a, npc.fw + 22, npc.fh - 11);
        };

        this.getOrder = () => npc.ry;
    };

    const getDrawableList = () => [new ColorGroups(Engine.hero)];

    API.addCallbackToEvent('call_draw_add_to_renderer', () => {
        Engine.renderer.add(...getDrawableList());
    });
})();