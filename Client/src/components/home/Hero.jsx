import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import animeImage1 from "../../assets/images/anime.png";
import animeImage2 from "../../assets/images/anime1.png";
import animeImage3 from "../../assets/images/anime2.png";
import animeImage4 from "../../assets/images/anime3.png";

gsap.registerPlugin(ScrollTrigger);

const heroImages = [
  animeImage1,
  animeImage2,
  animeImage3,
];

function Hero() {
  const heroRef = useRef(null);
  const copyScrollRef = useRef(null);
  const artScrollRef = useRef(null);
  const imageWrapRef = useRef(null);

  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const imageTimer = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % heroImages.length);
    }, 3500);

    return () => {
      window.clearInterval(imageTimer);
    };
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    const copyScroll = copyScrollRef.current;
    const artScroll = artScrollRef.current;
    const imageWrap = imageWrapRef.current;

    if (!hero || !copyScroll || !artScroll || !imageWrap) {
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) {
      gsap.set([copyScroll, artScroll, imageWrap], {
        clearProps: "all",
      });

      return;
    }

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 992px)", () => {
        const floatTween = gsap.to(imageWrap, {
          y: -9,
          duration: 3.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });

        const scrollTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "bottom top",
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });

        scrollTimeline
          .fromTo(
            copyScroll,
            {
              y: 0,
              opacity: 1,
            },
            {
              y: -45,
              opacity: 0.45,
              ease: "none",
            },
            0
          )
          .fromTo(
            artScroll,
            {
              x: 0,
              y: 0,
              scale: 1,
            },
            {
              x: -25,
              y: 40,
              scale: 1.035,
              ease: "none",
            },
            0
          );

        let mouseMoveHandler = null;
        let mouseLeaveHandler = null;

        if (window.matchMedia("(pointer: fine)").matches) {
          const imageX = gsap.quickTo(imageWrap, "x", {
            duration: 0.8,
            ease: "power3.out",
          });

          const imageRotation = gsap.quickTo(imageWrap, "rotation", {
            duration: 0.8,
            ease: "power3.out",
          });

          mouseMoveHandler = (event) => {
            const bounds = hero.getBoundingClientRect();

            const normalizedX =
              (event.clientX - bounds.left) / bounds.width - 0.5;

            imageX(normalizedX * 10);
            imageRotation(normalizedX * 0.5);
          };

          mouseLeaveHandler = () => {
            imageX(0);
            imageRotation(0);
          };

          hero.addEventListener("mousemove", mouseMoveHandler);
          hero.addEventListener("mouseleave", mouseLeaveHandler);
        }

        return () => {
          floatTween.kill();
          scrollTimeline.kill();

          if (mouseMoveHandler) {
            hero.removeEventListener("mousemove", mouseMoveHandler);
          }

          if (mouseLeaveHandler) {
            hero.removeEventListener("mouseleave", mouseLeaveHandler);
          }
        };
      });

      mm.add("(max-width: 991px)", () => {
        const mobileFloat = gsap.to(imageWrap, {
          y: -6,
          duration: 3.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });

        const mobileScroll = gsap.fromTo(
          artScroll,
          {
            y: 0,
          },
          {
            y: 20,
            ease: "none",
            scrollTrigger: {
              trigger: hero,
              start: "40% center",
              end: "bottom top",
              scrub: 1,
              invalidateOnRefresh: true,
            },
          }
        );

        return () => {
          mobileFloat.kill();
          mobileScroll.kill();
        };
      });

      const refreshTimer = window.setTimeout(() => {
        ScrollTrigger.refresh();
      }, 150);

      return () => {
        window.clearTimeout(refreshTimer);
        mm.revert();
      };
    }, hero);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <section className="home-hero" ref={heroRef}>
      <div className="hero-soft-glow hero-soft-glow-left" />
      <div className="hero-soft-glow hero-soft-glow-right" />

      <div className="site-container hero-content">
        <div ref={copyScrollRef} className="hero-copy-scroll">
          <motion.div
            className="hero-copy"
            initial={{
              opacity: 0,
              y: 32,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.75,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="hero-badge">
              <Sparkles size={14} />
              <span>The universe made for fans</span>
            </div>

            <h1>
              YOUR FANDOM.
              <span>YOUR UNIVERSE.</span>
            </h1>

            <p>
              One place for the worlds you obsess over. Discover stories,
              characters, communities, events and everything shaping fandom
              culture.
            </p>

            <div className="hero-actions">
              <a className="hero-primary-btn" href="#discover">
                Explore the universe
                <ArrowRight size={18} />
              </a>

              <Link className="hero-secondary-btn" to="/stories">
                <span className="play-circle">
                  <Play size={15} fill="currentColor" />
                </span>
                Watch the story
              </Link>
            </div>

            <div className="hero-meta">
              <div>
                <strong>08+</strong>
                <span>Fandom worlds</span>
              </div>

              <div>
                <strong>10K+</strong>
                <span>Stories & characters</span>
              </div>

              <div>
                <strong>∞</strong>
                <span>Ways to explore</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div ref={artScrollRef} className="hero-art-scroll">
          <motion.div
            className="hero-art hero-art-simple"
            initial={{
              opacity: 0,
              scale: 0.96,
              x: 25,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              x: 0,
            }}
            transition={{
              duration: 0.9,
              delay: 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="hero-image-soft-glow" />

            <div
              ref={imageWrapRef}
              className="hero-image-wrap"
              style={{
                width: "360px",
                height: "420px",
                maxWidth: "100%",
                margin: "0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "visible",
                background: "transparent",
                border: "none",
                position: "relative",
              }}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImage}
                  className="hero-character-image"
                  src={heroImages[activeImage]}
                  alt={`FanHub Plus hero ${activeImage + 1}`}
                  draggable="false"
                  initial={{
                    opacity: 0,
                    scale: 0.92,
                    x: 25,
                   
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: 0,
                    
                  }}
                  exit={{
                    opacity: 0,
                    scale: 1.04,
                    x: -20,
                   
                  }}
                  transition={{
                    duration: 0.7,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{
                    display: "block",
                    width: "auto",
                    height: "400px",
                    maxWidth: "360px",
                    maxHeight: "400px",
                    objectFit: "contain",
                    objectPosition: "center",
                    background: "transparent",
                    border: "none",
                    borderRadius: "0",
                    outline: "none",
                    boxShadow: "none",
                  }}
                />
              </AnimatePresence>

              <div className="hero-image-dots">
                {heroImages.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`hero-image-dot ${
                      activeImage === index ? "active" : ""
                    }`}
                    onClick={() => setActiveImage(index)}
                    aria-label={`Show hero image ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="hero-scroll-indicator">
        <span>SCROLL TO EXPLORE</span>

        <div className="scroll-line">
          <span />
        </div>
      </div>

      <div className="hero-bottom-line">
        <div className="marquee-track">
          <span>ANIME</span>
          <i>✦</i>
          <span>GAMING</span>
          <i>✦</i>
          <span>MANGA</span>
          <i>✦</i>
          <span>MOVIES</span>
          <i>✦</i>
          <span>K-POP</span>
          <i>✦</i>
          <span>COSPLAY</span>
          <i>✦</i>
          <span>ANIME</span>
          <i>✦</i>
          <span>GAMING</span>
          <i>✦</i>
          <span>MANGA</span>
          <i>✦</i>
          <span>MOVIES</span>
          <i>✦</i>
          <span>K-POP</span>
          <i>✦</i>
          <span>COSPLAY</span>
          <i>✦</i>
        </div>
      </div>
    </section>
  );
}

export default Hero;