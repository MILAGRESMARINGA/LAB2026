import {getBibleProjectVideos,type BibleProjectResource} from "./bibleproject";
const OFFICIAL_MUX_PLAYBACK_IDS:Readonly<Record<string,string>>={
 "guides:cantico-dos-canticos":"ZvNchtwxRkdAMxwsp01h4eRy6fizLZdvmiXMiHgCXZ4o",
 "videos:isaias-40-66":"QfhSLvjSJLTSkNnrj3yenAZnPfoe4siN01FeOH8WRIPU",
 "videos:lamentacoes":"iZCyGZtkfR02cclLSc6V2dXwu5CynVp3GwVEZ02AlhrsY",
 "videos:ezequiel-1-33":"KOH1M0201CKgxQ28nUnJpHzzLJFswch202WNFyu02Cbh6wk",
 "videos:ezequiel-34-48":"QUUGI29UVzj008MGe3uE3Fr33bHVeyqD5BEg01s1KsNw8",
 "videos:daniel":"Oq2auxf5WGMhkVAF01L5cKsgQkBS1v00PK01ptrP3X02uw00",
 "videos:oseias":"LMHIbw01XYDidh401AVLD2005Ylt5ocp6xcUJKFlv7W7UY",
 "videos:joel":"TRxY1it9PYtn4029XOvmawOB3YtlH9cQl7e5AowkPUEo",
 "videos:amos":"m4bchG7jxDHZL00W7TA8Tp2e8xmB02ZPJ3t6vwLt36FKE",
 "videos:obadias":"vhlg6S39CNGRArQMIkAnSSwk02uVy6WbuIDrluqpUWc8",
 "videos:jonas":"9EGLfN9wzz5mY4ISDJtAlD01hFp1mzSGf3hHj022wSF8k",
 "videos:miqueias":"3ZpEpFW0201HumzM5pBLohbTSwTWJBYTyDQUCrGj7fk8g",
 "videos:naum":"AIK83mmhV5g5MmpqfF1Q01iIiE9kYVYK6015uHK00scYX8",
 "videos:habacuque":"500wsTwg6p002HnLQOpRW01whp2rfEmJapnYibDsgeNwFY",
 "guides:sofonias":"BbWQ2GIv5bJe6z2oiQHCtUptrjMjD00P402EaDDfq028m8",
 "videos:ageu":"T17kctYKTrOG3RUFLgTuuV7b00hoLeSASMGqqpFvGN01U",
 "videos:zacarias":"a201ZAEmq5goV5NsA4IH5X6gvpYuTj6Ryq8WtgYzZ6N4",
 "videos:malaquias":"PWmo45IwxvOgTtFjsuPphFrbh1S77OvyFei9QaTUGbA",
 "videos:genesis-1-11":"dL4xWvlgZunv3bVvblYdj1002DbGMTM14eCvGpxL5NXA",
 "videos:genesis-12-50":"3nR8ZhegiUvhpCQiRPg4jOuSu6QmzmEyCC1tOmoIjgw",
 "videos:exodo-1-18":"2msblVtBK6Q1xphHFhowuvjF01WG1UxugU302xPfHjmOc",
 "videos:exodo-19-40":"k401xqmLtzT1g3IM00nFXdPc8Gq0100G7bPK1gksfmotcoc",
 "videos:levitico":"LaqEdztMuaTR00bLK00WKNi02kBNWrDsH00gcYjg028vvJ7M",
 "videos:numeros":"H9KDY6rN2KJzvfeqTY3qoiYaGHTxKIyn2b5EjKE1ZPI",
 "videos:deuteronomio":"I1hQqAYcwFrPLMoACPVNpAqHUlgJIL9mXsoUC01wtD400",
 "videos:josue":"FvZ3Tu9y8qcjeI8pAu3T2dVcCrT7A4MdoB9K4p92dLs",
 "videos:juizes":"g01EeMoXS8M19UAtL7xN1GmhRmfuQdO01SZ958C5bGDzA",
 "videos:rute":"Sd5ZhNVYjVwaCl2UgGm01q01jyYHg02BTvVkqDjrTDl87Q",
 "videos:1samuel":"yLxjge9GMTFb01wnqz201ZmnYHPbUcLCVySqVyVr6E00pY",
 "videos:2samuel":"F601qBB24M015oPSYyXy102Wcv1pAnGQgsu74eXV6UPSBs",
 "videos:1-e-2reis":"JcWMfno5T8lapSdSQq99Z78qp6biZruWkqeDfVezQOc",
 "videos:1-e-2cronicas":"jKLHX1Zkqn02Cgb3o021tpxkoe802FcQX7Fe00ILMOlUxag",
 "videos:esdras-neemias":"011sp3lLzofncBOluQaFl8eUh1jeZtklGeGMx004A2Psk",
 "videos:ester":"bIWsLSQ7jAid3PrygN8JsjtjZq99SaT501C23eDoOWw8",
 "videos:jo-2":"R5gSw1KtDmRGBE00AQYe3l3e4BKjHr00xYH3V7wisnn02I",
 "videos:proverbios-2":"HA1juUpRw01JlYHgmBBzWcjrS00Eyo4xyU41TMhf02ka7I",
 "videos:eclesiastes-2":"PC0201KNmudzahgtw01hGdE7a3rdSPLdN3S3sI7ud102CwA",
 "videos:isaias-1-39":"x302thP5LdGKGZUXeMaintnKnNztjjVxT9idjsotH3uc",
 "videos:jeremias":"3ceqGaBTq7r5DNblE01019mQOV3Rj7ypc3JN5uJj59Zus",
 "videos:joao-1-12":"6Jv9irM02dGz7GMMZNNcqjfmzmXZBiH78BmASX3pzhqs",
 "videos:joao-13-21":"UEnjYRzfjKhaFvkq948Ckssn01buvkwk1mLKXBYdyUaE",
 "videos:mateus-1-13":"nfYNd800BhBFWohsDw00LfoAz4f021EjnzmU5E02Y7VMoEU",
 "videos:mateus-14-28":"bK7g4dG1WnZcl02pEPcb02br3H8S1xiSstDdLRrqgZ02KE",
 "videos:marcos-2":"CRMK021k00QXKBKV4s1ExWhLJKN8uaLBu24FgP2vzY5CE",
 "videos:lucas-1-9":"PWk9pxAM2NhklJKJomFac52fgNJuRMONul01KxM5RXcI",
 "videos:lucas-10-24":"ipWkLjl5oGmG19xEcVbrupDMvgIlz43d2ORlxwsf6Xc",
 "videos:atos-1-12":"rWSJyUjSiv5s00MavFUlRqqEZulMq802L2hLSVkI7SchU",
 "videos:atos-13-28":"Utitpuot2bNP02dXpd6N7c2InESXk01NARvOEKQQyn7aY",
 "videos:romanos-1-4":"2hGAOu44gIuAOe2z8kqXZhYTK1YUqx82IiYuyMq4KBM",
 "videos:romanos-5-16":"qZ5Mg1DuchbtbAcPep1A602uvYPlbM1v2F01ZlQ7Ai55g",
 "videos:1corintios":"AtYnAO01XUFOFrAaqkORbxv3OCAxW6vdLAaLSaqgewNA",
 "videos:2corintios":"nIdmJHKx6f8IVFHpKnQop02E7kyPA9tEZ4hdwrMi7w8c",
 "videos:galatas":"oLjxjLIkZpSbJJ9WJcdhs39clc02nEOpwNtiffe8p0038",
 "videos:efesios":"EuMR02UspOSJHfbOY43OfJI8qk4wjlJhmt1KIHztJDcU",
 "videos:filipenses":"6hlPcqnFt7E02QWG6TAiJ2M9IvV6vzv2VZW6gb1AfopQ",
 "videos:colossenses":"hMz3Wx97IovrTutPF3OqLqzIZfwplS5DlIhoGi9eadA",
 "videos:1tessalonicenses":"o02ToAoND02VLhYwCvG1O02MpCKN502CLJcpD22tGz2pR7Y",
 "videos:2tessalonicenses":"Q65fnMLb1Uyz7PWk01VQVlyEds5IFWKmCYvAMpMNAcVg",
 "videos:1timoteo":"u800xuNT7mqErGQdH3gU26DJBcHgOmF8OLP00uDcu01HIw",
 "videos:2timoteo":"YPntXEQqKujGMS02pFmfN6Q18r29iow5jwpLB2PrUpCs",
 "videos:tito":"VwkCMdh6DlZl02vmv02wtbzYBQkS4UQuqABHoRgjZv2ug",
 "guides:1-3-joao":"AqUl2T01yD2bH2I9P8yuQZ4EC14SRMmMe01LzA24y5bhE",
 "videos:filemom":"a3lwrpVU01GSECxh9rhATXLe5m8rTVAk011Js01vdW4T9M",
 "videos:hebreus":"cspbnTdGU7A9Y1oY1KphzyZtndjKtpIu2022FPQVq7GI",
 "videos:tiago":"mz025eqzhDIv63JVb7HKkEpa3BYCR8gIp1018FkcEg8WQ",
 "videos:1pedro":"1za5vooWRn17hqXiBeownSito1ecWb01LvhFfoPGIZqY",
 "videos:2pedro":"l9xZsV2eK5nkD8vkAhuvDT4sPIPTNtnwmU02O8wNeNyA",
 "guides:judas":"nlXju3pDdAwSxzcCKF2Mew007Z2qXCvdn02xqSjTk4oKY",
 "videos:apocalipse-12-22":"WaVo01zoFRLZr005yk001qCOjbM9juOtJjk2BeKyaNG016s",
  "videos:salmos":"FlTguobiqO4NInc005m6CA4H3cDTkdm7uyqB2ZT4fc3Q",
 "videos:apocalipse-1-11":"bUN4JzBxt601knsms5I0201NA46LUH8DxAdHUyaxwdBbxc"
};
export function videoKeyFromUrl(url:string):string{
 const u=new URL(url);
 if(u.protocol!=="https:"||u.hostname!=="bibleproject.com")throw Error("Fonte de vídeo inválida");
 const parts=u.pathname.split("/").filter(Boolean);
 if(parts.length!==3||parts[0]!=="pt-br"||!["videos","guides"].includes(parts[1]))throw Error("Caminho de vídeo inválido");
 return parts.slice(-2).join(":");
}
export function embeddedPlayer(resource:BibleProjectResource,book:string):{src:string;exact:true}|{src:null;exact:false}{
 const matchesBook=getBibleProjectVideos(book).some(item=>item.url===resource.url);
 if(!matchesBook)return {src:null,exact:false};
 const key=videoKeyFromUrl(resource.url);
 const playback=OFFICIAL_MUX_PLAYBACK_IDS[key];
 if(playback)return {src:"https://player.mux.com/"+playback,exact:true};
 // Never display the first New Testament playlist item (often Matthew)
 // as if it were a verified video for the requested book.
 return {src:null,exact:false};
}
