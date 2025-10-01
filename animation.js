document.addEventListener('DOMContentLoaded', () => {

    gsap.registerPlugin(DrawSVGPlugin, EaselPlugin, MotionPathHelper, MotionPathPlugin, MorphSVGPlugin, RoughEase, ExpoScaleEase, CustomEase, CustomBounce)
        //===========================================================//
    let select = (e) => document.querySelector(e);
    let masterTL;
    const dist = 20;
    const bounceDur = 1.5;
    const circleBase = select("#circleBase");
    const SVGCOUNTAINER = select(".svgCounteriner");
    //===========================================================//
    function rockAnimate() {
        let tl = new gsap.timeline({
            repeat: 1,
            yoyo: true,
            repeatDelay: 0
        });
        tl.from("#circleBase", {
            duration: 1,
            drawSVG: "0%",
            ease: "power4"
        }).from(".r", {
            duration: 1,
            drawSVG: 0,
            ease: "elastic(0.9, 0.3)"
        });

        return tl;
    }
    //===========================================================//
    function paperAnimate() {
        let tl = new gsap.timeline({
            repeat: 1,
            yoyo: true,
            repeatDelay: 0
        });
        tl.from("#circleReverce", {
            duration: 1,
            drawSVG: "0%"
        }).from(".pp", {
            duration: 1,
            drawSVG: 0,
            ease: "elastic(0.9, 0.3)"
        });
        return tl;
    }
    //===========================================================//
    function scissorsAnimate() {
        let tl = new gsap.timeline({
            repeat: 1,
            yoyo: true,
            repeatDelay: 0
        });
        tl.from("#circleBase3", {
            duration: 1,
            drawSVG: "0%",
            ease: "power4"
        }).from(".s", {
            duration: 1,
            drawSVG: 0,
            ease: "elastic(0.9, 0.3)"
        });
        return tl;
    }
    //===========================================================//
    function rockAnimateB() {
        let tl = new gsap.timeline({
            repeat: 1,
            yoyo: true,
            repeatDelay: 0
        });
        tl.from("#circleBase2", {
                duration: 1,
                drawSVG: "0%",
                ease: "power4"
            })
            .to(".r", {
                duration: 1,
                drawSVG: "100%",
                ease: "elastic(0.9, 0.3)"
            });

        return tl;
    }
    //===========================================================//
    function paperAnimateB() {
        let tl = new gsap.timeline({
            repeat: 1,
            yoyo: true,
            repeatDelay: 0
        });
        tl.from("#circleReverce2", {
            duration: 1,
            drawSVG: "0%"
        }).to(".pp", {
            duration: 1,
            drawSVG: "100%",
            ease: "elastic(0.9, 0.3)"
        });
        return tl;
    }
    //===========================================================//
    function scissorsAnimateB() {
        let tl = new gsap.timeline({
            repeat: 1,
            yoyo: true,
            repeatDelay: 0
        });
        tl.from("#circleBase4", {
            duration: 1,
            drawSVG: 0,
            ease: "power4"
        }).to(".s", {
            duration: 1,
            drawSVG: "100%",
            ease: "elastic(0.9, 0.3)"
        });
        return tl;
    }
    //===========================================================//
    function init() {
        gsap.set(SVGCOUNTAINER, {
            autoAlpha: 1
        });
        masterTL = gsap.timeline({
            repeat: -1,
            repeatDelay: 0
        });
        masterTL.add(rockAnimate(), 0).timeScale(1.5);
        masterTL.add(paperAnimate(), 4).timeScale(1.5);
        masterTL.add(scissorsAnimate(), 8).timeScale(1.5);
        masterTL.add(rockAnimateB(), 12).timeScale(1.5);
        masterTL.add(paperAnimateB(), 16).timeScale(1.5);
        masterTL.add(scissorsAnimateB(), 20).timeScale(1.5);
    }
    //===========================================================//
    window.onload = () => {
        init();
    };
    //===========================================================//

});